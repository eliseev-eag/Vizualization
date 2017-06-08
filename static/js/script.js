import * as vis from 'vis';
import 'vis/dist/vis-timeline-graph2d.min.css';

import * as tabs from './infoTabs';
import * as searchForm from './search';
import * as converter from './converter';
import * as requester from './requester';

import '../css/style.css';
import '../css/classItems.css';

let items;
let timeline;
let groups;

const defaultMaxDate = new Date();
defaultMaxDate.setFullYear(defaultMaxDate.getFullYear() + 5);

const defaultMinDate = new Date(100, 0, 0);
const options = {
    align: 'center',
    minHeight: '400px',
    maxHeight: '400px',
    type: 'range',
    tooltip: {
        followMouse: true,
        overflowMethod: 'cap'
    },
    snap: null,
    orientation: {axis: 'both'},
    dataAttributes: ['id'],
    zoomMin: 1000 * 60 * 60 * 24 * 5,
    max: defaultMaxDate,
    min: defaultMinDate
};

window.onload = ()=>{
    let searchResetCallback = (data) => {
        items.clear();
        options.min = defaultMinDate;
        options.max = defaultMaxDate;
        timeline.setOptions(options);
        timeline.moveTo(Date.now());
        timeline.on('rangechanged', HideItems);
    };

    let searchActivateCallback = (data) => {
        timeline.off('rangechanged', HideItems);
        items.clear();
        const min_date = new Date(data['min_date']);
        min_date.setFullYear(min_date.getFullYear() - 5);
        const max_date = new Date(data['max_date']);
        max_date.setFullYear(max_date.getFullYear() + 5);
        options.min = min_date;
        options.max = max_date;
        timeline.setOptions(options);
        const result = converter.convertBackendObjectsToFrontendObjects(data['events'],groups);
        timeline.moveTo(data['min_date']);
        items.update(result);
    };

    searchForm.InitSearchForm(searchActivateCallback, searchResetCallback);
    tabs.InitTabs();
    initGroups();
};

function initGroups() {
    const classes = ['blue', 'red', 'purple', 'yellow', 'green'];

    requester.GetEventTypes()
        .then(eventTypes => {
            const groupsItemsArray = eventTypes.map( eventTypesItem =>{
                const groupItem = {};
                groupItem.id = eventTypesItem;
                groupItem.content = eventTypesItem;
                groupItem.class = classes[Math.floor(Math.random() * classes.length)];
                groupItem.visible = true;
                return groupItem;
            });
            initializeChart(groupsItemsArray);
            searchForm.InitGroupsHide(groups);
        })
        .catch(data => console.log(data));
}

function initializeChart(groupsItemsArray) {
    const container = document.getElementById('graph');

    items = new vis.DataSet();
    groups = new vis.DataSet(groupsItemsArray);
    timeline = new vis.Timeline(container, items, groups, options);

    timeline.on('rangechanged', UploadEventsAjax);
    timeline.on('rangechanged', UploadAndHideNestedEvents);
    timeline.on('rangechanged', HideItems);
    timeline.on('select', LoadFullInfo);
}

function LoadFullInfo(properties) {
    const eventId = properties.items[0];
    if (tabs.ActivateTabIfExists(eventId))
        return;
    requester.GetFullInfo(eventId)
        .then(data => tabs.CreateTab(data))
        .catch(data => console.log(data));
}

function HideItems(environments) {
    hideSmallItems(environments.end, environments.start);
}
function hideSmallItems(end, start) {
    const visibleItemsIndexes = timeline.getVisibleItems();
    visibleItemsIndexes.forEach(visibleItemIndex => {
        const visibleItem = items.get(visibleItemIndex);
        const timeline_length = end - start;
        if (visibleItem.duration < timeline_length * 0.008) {
            items.remove(visibleItem);
        }
    });
}

let isUploadingNestedNow = false;
let nested_env;
function UploadAndHideNestedEvents(environments) {
    nested_env = environments;
    if (isUploadingNestedNow) {
        return;
    }

    const visibleItemsIndexes = timeline.getVisibleItems();
    visibleItemsIndexes.forEach(visibleItemIndex => {
        let visibleItem = items.get(visibleItemIndex);
        const timeline_length = environments.end - environments.start;

        if (!visibleItem || visibleItem.nested === null) return;

        if (visibleItem.duration < timeline_length * 0.15 && visibleItem.type === 'background') {
            if (searchForm.serializedSearchForm === null) {
                items.remove(visibleItem.nested);
                visibleItem.nested = [];
            }
            visibleItem.type = 'range';
            items.update(visibleItem);
            return;
        }

        if ((visibleItem.nested === undefined || !visibleItem.nested.length) && visibleItem.duration > timeline_length * 0.2) {
            const saved_environments = environments;
            isUploadingNestedNow = true;
            requester.UploadNestedEvents(visibleItem.id)
                .then(data => {
                    let nestedEvents = converter.convertBackendObjectsToFrontendObjects(data['events'],groups);
                    if (nestedEvents.length > 0) {
                        visibleItem.nested = nestedEvents.map(nestedEvent => nestedEvent.id );
                        visibleItem.type = 'background';
                        items.update(nestedEvents);
                    }
                    else {
                        visibleItem.nested = null;
                    }
                    items.update(visibleItem);
                    isUploadingNestedNow = false;
                })
                .catch(data => console.log(data));

            setTimeout(() => {
                if (saved_environments !== nested_env)
                    UploadAndHideNestedEvents(nested_env);
            }, 800);
        }
    });
}

let isUploadingEventsNow = false;
let saved_env;

function UploadEventsAjax(environments) {
    saved_env = environments;
    if (isUploadingEventsNow) {
        return;
    }

    isUploadingEventsNow = true;
    const timelineLength = saved_env.end - saved_env.start;
    const dateTime = extractTimelineLenght(timelineLength);
    const offsetEndDate = dateTime.offsetEndDate;
    const offsetStartDate = dateTime.offsetStartDate;

    requester.UploadEvents(offsetStartDate.toISOString().slice(0, 10), offsetEndDate.toISOString().slice(0, 10),searchForm)
        .then(data => {
            const uploadedItems = converter.convertBackendObjectsToFrontendObjects(data['events'],groups);
            items.update(uploadedItems);
            isUploadingEventsNow = false;
        })
        .catch(data => console.log(data));
}

function extractTimelineLenght(timelineLength) {
    let offsetEndDate = new Date(saved_env.end.getTime() + timelineLength * 0.2);
    let offsetStartDate = new Date(saved_env.start.getTime() - timelineLength * 0.2);
    if (offsetStartDate < options.min)
        offsetStartDate = options.min;
    if (offsetEndDate > options.max)
        offsetEndDate = options.max;
    return {offsetEndDate: offsetEndDate, offsetStartDate: offsetStartDate};
}