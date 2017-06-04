/**
 * Created by happy on 02.06.2017.
 */
$(document).ready(function () {
    $('#btnAdd').click();

    $('#info_tabs').on('click', '.closeTab', function () {
        var tabContentId = $(this).parent().attr("href");
        $(this).parent().parent().remove(); //remove li of tab
        $(tabContentId).remove(); //remove respective tab content

        $('#tabs a:last').tab('show');
    });
});

function CreateTab(eventInfo) {

    $('<li><a href="#tab' + eventInfo.id + '" data-toggle="tab">' + eventInfo.name + '<button class="close closeTab" type="button">×</button></a></li>').appendTo('#tabs');
    var duration = Math.floor((new Date(eventInfo.end_date) - new Date(eventInfo.start_date)) / (1000 * 60 * 60 * 24));

    var content = '<div class="tab-pane" id="tab' + eventInfo.id + '">' +
        '<h4>' + eventInfo.name + '</h4>' +
        '<div><b>Дата начала: </b>' + convertDateToRusStandart(eventInfo.start_date) + ' г.</div>' +
        '<div><b>Дата окончания: </b>' + convertDateToRusStandart(eventInfo.end_date) + ' г.</div>' +
        '<div><b>Продолжительность: </b>' + duration + ' дн.</div>' +
        '<div><b>Тип: </b>' + eventInfo.event_type + '</div>' +
        '<div><b>Действующие лица: </b><ul>';
    eventInfo.persons.forEach(function (person) {
        content = content + '<li>' + person + '</li>'
    });
    content = content + '</ul></div>';
    content = content + '<div><b>Встречаемые топонимы: </b><ul>';
    eventInfo.toponyms.forEach(function (toponym) {
        content = content + '<li>' + toponym + '</li>'
    });
    content = content + '</ul></div>';
    content = content + '</div>';
    $(content).appendTo('.tab-content');

    $('#tabs a:last').tab('show');
}