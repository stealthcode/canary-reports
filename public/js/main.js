var root = this;

define('jquery', ['http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.8.3.js'], function () { return root.$; });
define('bootstrap', ['js/vendor/bootstrap.min.js']);
define('ko', ['http://ajax.aspnetcdn.com/ajax/knockout/knockout-2.1.0.js'], function (ko) { return ko; });
define('underscore', ['js/vendor/underscore.js'], function () { return root._; });