(function () {
    "use strict";

    var ui = WinJS.UI;

    WinJS.UI.Pages.define("/pages/home/home.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            WinJS.Resources.processAll();

            var listView = element.querySelector("#mylistview").winControl;
            JSONRPC.VideoLibrary.getMovies({ "properties": ["fanart", "thumbnail"] }).then(
                function (result) {
                    if (result) {
                        var urlHttp = 'http://192.168.1.100:8080';

                        var obtainedData = {};
                        obtainedData.movies = [];
                        result.movies.forEach(function (entry) {
                            var thumb = '#';
                            if (entry.thumbnail != '') {
                                thumb = urlHttp + '/image/' + encodeURIComponent(entry.thumbnail);
                            }
                            obtainedData.movies.push({ movieid: entry.movieid, label: entry.label, thumbnail: thumb });
                        });

                        ui.setOptions(listView, {
                            itemDataSource: new WinJS.Binding.List(obtainedData.movies).dataSource
                        });
                    }
                },
                function (e) {
                    var msg = new Windows.UI.Popups.MessageDialog(e.message);
                    msg.showAsync();
                }
            );

        }
    });
})();
