/**
 * Created by happy on 08.06.2017.
 */

export function convertBackendObjectsToFrontendObjects(items, groups) {
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

export function convertDateToRusStandart(date) {
    const splittedDate = date.split('-');
    return splittedDate[2] + '.' + splittedDate[1] + '.' + splittedDate[0];
}