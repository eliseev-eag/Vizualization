import $ from 'jquery';
import {tab} from 'bootstrap';

//import vis from 'vis';
import {init,CreateTab} from './infoTabs';
import {datetimepicker} from 'eonasdan-bootstrap-datetimepicker';

export {convertDateToRusStandart};

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

$(document).ready(function () {
    $('#start_date').datetimepicker({locale: 'ru', format: 'L'});
    $('#end_date').datetimepicker({locale: 'ru', format: 'L'});

    const searchForm = $('#search');
    searchForm.submit(function () {
        search(searchForm);
        return false;
    });
    init();
    initGroups();
});

let serializedSearchForm = null;
function search(searchForm) {
    $('#searchError').addClass('hidden');

    if (searchForm.serializeArray().every(function (element) {
        return element.value === '';
    })) {
        serializedSearchForm = null;
        items.clear();
        options.min = defaultMinDate;
        options.max = defaultMaxDate;
        timeline.setOptions(options);
        timeline.moveTo(Date.now());
        timeline.on('rangechanged', HideItems);
        return;
    }

    serializedSearchForm = searchForm.serializeArray();
    serializedSearchForm.push({name: 'count', value: 100});
    $.ajax({
        type: searchForm.attr('method'),
        url: searchForm.attr('action'),
        data: serializedSearchForm,
    })
        .done(function (data) {
            if (data.events.length === 0) {
                $('#searchError').html('Ничего не найдено :(');
                $('#searchError').removeClass('hidden');
                return;
            }
            timeline.off('rangechanged', HideItems);
            items.clear();
            const min_date = new Date(data['min_date']);
            min_date.setFullYear(min_date.getFullYear() - 5);
            const max_date = new Date(data['max_date']);
            max_date.setFullYear(max_date.getFullYear() + 5);
            options.min = min_date;
            options.max = max_date;
            timeline.setOptions(options);
            const result = convertToDistObject(data['events']);
            timeline.moveTo(data['min_date']);
            items.update(result);
        })
        .fail(data => console.log(data));
}

function initGroups() {
    const classes = ['blue', 'red', 'purple', 'yellow', 'green'];

    $.ajax({
        type: 'GET',
        url: 'event_types',
    })
        .done(function (eventTypes) {
            const groupsItemsArray = eventTypes.map(function (eventTypesItem) {
                const groupItem = {};
                groupItem.id = eventTypesItem;
                groupItem.content = eventTypesItem;
                groupItem.class = classes[Math.floor(Math.random() * classes.length)];
                groupItem.visible = true;
                return groupItem;
            });
            initializeChart(groupsItemsArray);

            $(':checkbox').change(function () {
                const groupId = $(this).val();
                const group = groups.get(groupId);
                group.visible = !group.visible;
                groups.update(group);
            });
        });
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
    const tabSelector = '#tab' + eventId;
    if ($(tabSelector).length !== 0) {
        $('a[href="' + tabSelector + '"]').tab('show');
        return;
    }
    $.ajax({
        type: 'GET',
        url: 'full_info/' + eventId
    })
        .done(function (data) {
            return CreateTab(data);
        })
        .fail(data => console.log(data));
}

function HideItems(environments) {
    hideSmallItems(environments.end, environments.start);
}
function hideSmallItems(end, start) {
    const visibleItemsIndexes = timeline.getVisibleItems();
    visibleItemsIndexes.forEach(function (visibleItemIndex) {
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
    visibleItemsIndexes.forEach(function (visibleItemIndex) {
        let visibleItem = items.get(visibleItemIndex);
        const timeline_length = environments.end - environments.start;

        if (!visibleItem || visibleItem.nested === null) return;

        if (visibleItem.duration < timeline_length * 0.15 && visibleItem.type === 'background') {
            if (serializedSearchForm === null) {
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
            uploadNestedEventsAjax(visibleItem.id)
                .then(function (rows) {
                    if (rows.length > 0) {
                        visibleItem.nested = rows.map(function (rowsItem) {
                            return rowsItem.id;
                        });
                        visibleItem.type = 'background';
                        items.update(rows);
                    }
                    else {
                        visibleItem.nested = null;
                    }
                    items.update(visibleItem);
                    isUploadingNestedNow = false;
                })
                .catch(data => console.log(data));

            setTimeout(function () {
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

    uploadEventsAjax(offsetStartDate.toISOString().slice(0, 10), offsetEndDate.toISOString().slice(0, 10))
        .then(function (rows) {
            items.update(rows);
            isUploadingEventsNow = false;
        })
        .catch(data => console.log(data));

}

function uploadEventsAjax(start_date, end_date) {
    return new Promise(function (resolve, reject) {
        let requestType = 'GET';
        let requestData = null;

        if (serializedSearchForm !== null) {
            requestType = 'POST';
            requestData = serializedSearchForm;
        }

        $.ajax({
            type: requestType,
            url: 'events/' + start_date + '/' + end_date + '/',
            data: requestData
        })
            .done(function (data) {
                const result = convertToDistObject(data['events']);
                resolve(result);
            })
            .fail(function (data) {
                reject(data);
            });
    });
}

function uploadNestedEventsAjax(parent_event_id) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            type: 'GET',
            url: 'nested_events/' + parent_event_id,
        })
            .done(function (data) {
                let result = convertToDistObject(data['events']);
                resolve(result);
            })
            .fail(function (data) {
                reject(data);
            });
    });
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

function convertToDistObject(items) {
    items.forEach(function (item) {
        item.content = item.name;
        item.start = item.start_date;
        item.end = item.end_date;
        item.duration = (new Date(item.end_date) - new Date(item.start_date));
        item.group = item.event_type;
        const groupItem = groups.get(item.group);
        if (groupItem)
            item.className = groupItem.class;
        item.title =
            `
    <h3 class="eventname">${item.name}</h3>
    <hr>
    <div class="dates">
        <div> ${convertDateToRusStandart(item.start_date)} - ${convertDateToRusStandart(item.end_date)}</div>
        <div><b>Продолжительность: </b>${Math.floor(item.duration / (1000 * 60 * 60 * 24))} дн.</div>
    </div>`;
    });
    return items;
}

function convertDateToRusStandart(date) {
    const splittedDate = date.split('-');
    return splittedDate[2] + '.' + splittedDate[1] + '.' + splittedDate[0];
}