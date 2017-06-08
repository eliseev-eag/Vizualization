/**
 * Created by happy on 08.06.2017.
 */

import $ from 'jquery';
import {InitDateTimePickers} from './dateTimePickers';

import '../css/search.css';

export function InitSearchForm(searchSuccess, searchFailed) {
    const searchForm = $('#search');
    searchForm.submit(function () {
        search(searchForm,searchSuccess,searchFailed);
        return false;
    });
    InitDateTimePickers();
}

export let serializedSearchForm = null;

function search(searchForm, searchSuccess, searchFailed) {
    $('#searchError').addClass('hidden');

    if (searchForm.serializeArray().every(function (element) {
        return element.value === '';
    })) {
        serializedSearchForm = null;
        searchFailed();
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
            searchSuccess(data);
        })
        .fail(data => console.log(data));
    return false;
}