/**
 * Created by happy on 08.06.2017.
 */

import $ from 'jquery';
import {InitDateTimePickers} from './dateTimePickers';
import * as requester from './requester';
import '../css/search.css';

export function InitSearchForm(searchSuccess, searchFailed) {
    const searchForm = $('#search');
    searchForm.submit(function () {
        search(searchForm,searchSuccess,searchFailed);
        return false;
    });
    InitDateTimePickers();
}

export function InitGroupsHide(groups) {
    $(':checkbox').change(function(){
        const groupId = $(this).val();
        const group = groups.get(groupId);
        group.visible = !group.visible;
        groups.update(group);
    });
}

export let serializedSearchForm = null;

function search(searchForm, searchActivate, searchReset) {
    $('#searchError').addClass('hidden');

    if (searchForm.serializeArray().every(function (element) {
        return element.value === '';
    })) {
        serializedSearchForm = null;
        searchReset();
        return;
    }

    serializedSearchForm = searchForm.serializeArray();
    serializedSearchForm.push({name: 'count', value: 100});
    requester.SearchFirstItems(searchForm,serializedSearchForm)
        .then(function (data) {
            if (data.events.length === 0) {
                $('#searchError').html('Ничего не найдено :(');
                $('#searchError').removeClass('hidden');
                return;
            }
            searchActivate(data);
        })
        .catch(data => console.log(data));
    return false;
}