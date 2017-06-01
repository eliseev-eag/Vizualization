/**
 * Created by happy on 31.05.2017.
 */

function FillFullnameForm(event, x, y, hideConditionCallback) {
    var fullname = document.getElementById('fullname');
    if (hideConditionCallback)
        if (hideConditionCallback()) {
            fullname.style.display = 'none';
            return;
        }
    var eventname = document.getElementById('eventname');
    var spanWithStartDate = document.getElementById('start');
    var spanWithEndDate = document.getElementById('end');
    var spanWithDurationTime = document.getElementById('duration');

    eventname.innerHTML = event.content;
    spanWithStartDate.innerHTML = convertDateToRusStandart(event.start);
    spanWithEndDate.innerHTML = convertDateToRusStandart(event.end);
    var millisecInDay = 1000 * 60 * 60 * 24;
    spanWithDurationTime.innerHTML = Math.floor(event.duration / millisecInDay);

    fullname.style.left = x + 'px';
    fullname.style.top = y + 'px';
    if ($(fullname).width() + x > $(window).width())
        fullname.style.left = $(window).width() - $(fullname).width() - 10 + 'px';
    if ($(fullname).height() + y > $(window).height())
        fullname.style.top = $(window).height() - $(fullname).height() - 10 + 'px';
    fullname.style.display = 'block';
}

function convertDateToRusStandart(date) {
    var splittedDate = date.split('-');
    return splittedDate[2] + '.' + splittedDate[1] + '.' + splittedDate[0];
}