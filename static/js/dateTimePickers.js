/**
 * Created by happy on 08.06.2017.
 */

import $ from 'jquery';
import 'eonasdan-bootstrap-datetimepicker';
import 'eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.min.css';

export function InitDateTimePickers() {
    $('#start_date').datetimepicker({locale: 'ru', format: 'L'});
    $('#end_date').datetimepicker({locale: 'ru', format: 'L'});
}
