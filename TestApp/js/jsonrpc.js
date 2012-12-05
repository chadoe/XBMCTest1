(function () {
    var url = 'http://192.168.1.100:8080/jsonrpc';
    function getMovies() {
        return new WinJS.Promise(function (complete, error) {
            var data = JSON.stringify({ "jsonrpc": "2.0", "method": "VideoLibrary.GetMovies", "id": "getmovies" });

            WinJS.xhr({
                type: "POST",
                url: url,
                data: data,
                headers: { "Content-type": "application/json" },
                responseType: "application/json"
            }).then(function (response) {
                var obtainedData = window.JSON.parse(response.responseText);
                complete(obtainedData.result);
            }, function (e) {
                error(e);
            });

        });
    }


    WinJS.Namespace.define("JSONRPC", {
        VideoLibrary: WinJS.Class.define({
            GetMovies: getMovies
        }),
    });
})();