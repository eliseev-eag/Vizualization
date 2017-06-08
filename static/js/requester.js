/**
 * Created by happy on 08.06.2017.
 */

import $ from 'jquery';

export function UploadNestedEvents(parent_event_id) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'GET',
            url: 'nested_events/' + parent_event_id,
        })
            .done(function (data) {
                resolve(data);
            })
            .fail(function (data) {
                reject(data);
            });
    });
}

export function UploadEvents(start_date, end_date, searchForm) {
    return new Promise((resolve, reject) => {
        let requestType = 'GET';
        let requestData = null;

        if (searchForm){
            if (searchForm.serializedSearchForm !== null) {
                requestType = 'POST';
                requestData = searchForm.serializedSearchForm;
            }
        }

        $.ajax({
            type: requestType,
            url: 'events/' + start_date + '/' + end_date + '/',
            data: requestData
        })
            .done(data => resolve(data))
            .fail(data => reject(data));
    });
}

export function GetEventTypes() {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'GET',
            url: 'event_types',
        }).done(data => resolve(data)).fail(data => reject(data));
    });
}

export function GetFullInfo(eventId) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'GET',
            url: 'full_info/' + eventId
        })
            .done(data => resolve(data))
            .fail(data => reject(data));
    });
}

export function SearchFirstItems(searchForm, serializedSearchForm) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: searchForm.attr('method'),
            url: searchForm.attr('action'),
            data: serializedSearchForm,
        })
            .done(data => resolve(data))
            .fail(data => reject(data));
    });
}