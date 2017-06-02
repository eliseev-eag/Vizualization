/**
 * Created by happy on 02.06.2017.
 */
$(document).ready(function () {
    $('#btnAdd').click(function (e) {
        var nextTab = $('#tabs li').length + 1;

        // create the tab
        $('<li><a href="#tab' + nextTab + '" data-toggle="tab">Tab ' + nextTab + ' <button class="close closeTab" type="button">×</button></a></li>').appendTo('#tabs');

        // create the tab content
        $('<div class="tab-pane" id="tab' + nextTab + '">tab' + nextTab + ' content</div>').appendTo('.tab-content');

        // make the new tab active
        $('#tabs a:last').tab('show');
    });

    $('#info_tabs').on('click', '.closeTab', function () {
        var tabContentId = $(this).parent().attr("href");
        $(this).parent().parent().remove(); //remove li of tab
        $(tabContentId).remove(); //remove respective tab content

        $('#tabs a:last').tab('show');
    });
})