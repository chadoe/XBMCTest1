(function () {
    var urlWs = 'ws://192.168.1.100:9090/jsonrpc/';
    var urlHttp = 'http://192.168.1.100:8080';

    var messageWebSocket;
    var messageWriter;
    var promises = {};

    function getError(e) {
        var webSocketError = Windows.Networking.Sockets.WebSocketError.getStatus(e.number);
        switch (webSocketError) {
            case Windows.Web.WebErrorStatus.unknown: return e;
            case Windows.Web.WebErrorStatus.certificateCommonNameIsIncorrect: return "CertificateCommonNameIsIncorrect";
            case Windows.Web.WebErrorStatus.certificateExpired: return "CertificateExpired";
            case Windows.Web.WebErrorStatus.certificateContainsErrors: return "CertificateContainsErrors";
            case Windows.Web.WebErrorStatus.certificateRevoked: return "CertificateRevoked";
            case Windows.Web.WebErrorStatus.certificateIsInvalid: return "CertificateIsInvalid";
            case Windows.Web.WebErrorStatus.serverUnreachable: return "ServerUnreachable";
            case Windows.Web.WebErrorStatus.timeout: return "Timeout";
            case Windows.Web.WebErrorStatus.errorHttpInvalidServerResponse: return "ErrorHttpInvalidServerResponse";
            case Windows.Web.WebErrorStatus.connectionAborted: return "ConnectionAborted";
            case Windows.Web.WebErrorStatus.connectionReset: return "ConnectionReset";
            case Windows.Web.WebErrorStatus.disconnected: return "Disconnected";
            case Windows.Web.WebErrorStatus.httpToHttpsOnRedirection: return "HttpToHttpsOnRedirection";
            case Windows.Web.WebErrorStatus.httpsToHttpOnRedirection: return "HttpsToHttpOnRedirection";
            case Windows.Web.WebErrorStatus.cannotConnect: return "CannotConnect";
            case Windows.Web.WebErrorStatus.hostNameNotResolved: return "HostNameNotResolved";
            case Windows.Web.WebErrorStatus.operationCanceled: return "OperationCanceled";
            case Windows.Web.WebErrorStatus.redirectFailed: return "RedirectFailed";
            case Windows.Web.WebErrorStatus.unexpectedStatusCode: return "UnexpectedStatusCode";
            case Windows.Web.WebErrorStatus.unexpectedRedirection: return "UnexpectedRedirection";
            case Windows.Web.WebErrorStatus.unexpectedClientError: return "UnexpectedClientError";
            case Windows.Web.WebErrorStatus.unexpectedServerError: return "UnexpectedServerError";
            case Windows.Web.WebErrorStatus.multipleChoices: return "MultipleChoices (300)";
            case Windows.Web.WebErrorStatus.movedPermanently: return "MovedPermanently (301)";
            case Windows.Web.WebErrorStatus.found: return "Found (302)";
            case Windows.Web.WebErrorStatus.seeOther: return "SeeOther (303)";
            case Windows.Web.WebErrorStatus.notModified: return "NotModified (304)";
            case Windows.Web.WebErrorStatus.useProxy: return "UseProxy (305)";
            case Windows.Web.WebErrorStatus.temporaryRedirect: return "TemporaryRedirect (307)";
            case Windows.Web.WebErrorStatus.badRequest: return "BadRequest (400)";
            case Windows.Web.WebErrorStatus.unauthorized: return "Unauthorized (401)";
            case Windows.Web.WebErrorStatus.paymentRequired: return "PaymentRequired (402)";
            case Windows.Web.WebErrorStatus.forbidden: return "Forbidden (403)";
            case Windows.Web.WebErrorStatus.notFound: return "NotFound (404)";
            case Windows.Web.WebErrorStatus.methodNotAllowed: return "MethodNotAllowed (405)";
            case Windows.Web.WebErrorStatus.notAcceptable: return "NotAcceptable (406)";
            case Windows.Web.WebErrorStatus.proxyAuthenticationRequired: return "ProxyAuthenticationRequired (407)";
            case Windows.Web.WebErrorStatus.requestTimeout: return "RequestTimeout (408)";
            case Windows.Web.WebErrorStatus.conflict: return "Conflict (409)";
            case Windows.Web.WebErrorStatus.gone: return "Gone (410)";
            case Windows.Web.WebErrorStatus.lengthRequired: return "LengthRequired (411)";
            case Windows.Web.WebErrorStatus.preconditionFailed: return "PreconditionFailed (412)";
            case Windows.Web.WebErrorStatus.requestEntityTooLarge: return "RequestEntityTooLarge (413)";
            case Windows.Web.WebErrorStatus.requestUriTooLong: return "RequestUriTooLong (414)";
            case Windows.Web.WebErrorStatus.unsupportedMediaType: return "UnsupportedMediaType (415)";
            case Windows.Web.WebErrorStatus.requestedRangeNotSatisfiable: return "RequestedRangeNotSatisfiable (416)";
            case Windows.Web.WebErrorStatus.expectationFailed: return "ExpectationFailed (417)";
            case Windows.Web.WebErrorStatus.internalServerError: return "InternalServerError (500)";
            case Windows.Web.WebErrorStatus.notImplemented: return "NotImplemented (501)";
            case Windows.Web.WebErrorStatus.badGateway: return "BadGateway (502)";
            case Windows.Web.WebErrorStatus.serviceUnavailable: return "ServiceUnavailable (503)";
            case Windows.Web.WebErrorStatus.gatewayTimeout: return "GatewayTimeout (504)";
            case Windows.Web.WebErrorStatus.httpVersionNotSupported: return "HttpVersionNotSupported (505)";
            default: return e;
        }
    };

    function validateAndCreateUri(uriString) {
        // Create a Uri instance and catch exceptions related to invalid input. This method returns 'true'
        // if the Uri instance was successfully created and 'false' otherwise.
        var webSocketUri;
        try {
            webSocketUri = new Windows.Foundation.Uri(uriString);
        } catch (error) {
            WinJS.log && WinJS.log("Error: Invalid URI", "sample", "error");
            return null;
        }

        if (webSocketUri.fragment !== "") {
            WinJS.log && WinJS.log("Error: URI fragments not supported in WebSocket URIs.", "sample", "error");
            return null;
        }

        // Uri.schemeName returns the canonicalized scheme name so we can use case-sensitive, ordinal string
        // comparison.
        var scheme = webSocketUri.schemeName;
        if ((scheme !== "ws") && (scheme !== "wss")) {
            WinJS.log && WinJS.log("Error: WebSockets only support ws:// and wss:// schemes.", "sample", "error");
            return null;
        }

        return webSocketUri;
    }

    function log(text) {
        document.getElementById("outputField").innerHTML += text + "<br>";
    }

    function onMessageReceived(args) {
        // The incoming message is already buffered.
        var dataReader = args.getDataReader();
        log("Message Received; Type: " + getMessageTypeName(args.messageType)
            + ", Bytes: " + dataReader.unconsumedBufferLength + ", Text: ");

        var data = dataReader.readString(dataReader.unconsumedBufferLength);
        log(data);
        var resObj = JSON.parse(data);
        if (resObj.id) {
            promises[resObj.id].complete(resObj);
            delete promises[resObj.id];
        }

    }

    function getMessageTypeName(messageType) {
        switch (messageType) {
            case Windows.Networking.Sockets.SocketMessageType.utf8:
                return "UTF-8";
            case Windows.Networking.Sockets.SocketMessageType.binary:
                return "Binary";
            default:
                return "Unknown";
        }
    }

    function sendMessage(message) {
        log("Sending message");
        messageWriter.writeString(message);
        messageWriter.storeAsync().done("", sendError);
    }

    function sendError(error) {
        log("Send error: " + getError(error));
    }

    function onClosed(args) {
        log("Closed; Code: " + args.code + " Reason: " + args.reason);
        if (!messageWebSocket) {
            return;
        }

        closeSocketCore();
    }

    function closeSocket() {
        if (!messageWebSocket) {
            WinJS.log && WinJS.log("Not connected", "sample", "status");
            return;
        }

        WinJS.log && WinJS.log("Closing", "sample", "status");
        closeSocketCore(1000, "Closed due to user request.");
    }

    function closeSocketCore(closeCode, closeStatus) {
        if (closeCode && closeStatus) {
            messageWebSocket.close(closeCode, closeStatus);
        } else {
            messageWebSocket.close();
        }

        messageWebSocket = null;

        if (messageWriter) {
            messageWriter.close();
            messageWriter = null;
        }
    }

    function Send(methodName, params) {

        return new WinJS.Promise(function (cbcomplete, cberror) {
            var reqObj = { "jsonrpc": "2.0", "method": methodName, "params": params, "id": "getmovies" };

            promises[reqObj.id] = { complete: cbcomplete, error: cberror };

            if (!messageWebSocket) {
                // Set up the socket data format and callbacks
                var webSocket = new Windows.Networking.Sockets.MessageWebSocket();
                // Both utf8 and binary message types are supported. If utf8 is specified then the developer
                // promises to only send utf8 encoded data.
                webSocket.control.messageType = Windows.Networking.Sockets.SocketMessageType.utf8;
                webSocket.onmessagereceived = onMessageReceived;
                webSocket.onclosed = onClosed;

                var uri = validateAndCreateUri(urlWs);
                if (!uri) {
                    error({ message: "Invalid uri: " + uri });
                }

                WinJS.log && WinJS.log("Connecting to: " + uri.absoluteUri, "sample", "status");

                webSocket.connectAsync(uri).done(function () {

                    WinJS.log && WinJS.log("Connected", "sample", "status");

                    messageWebSocket = webSocket;
                    // The default DataWriter encoding is utf8.
                    messageWriter = new Windows.Storage.Streams.DataWriter(webSocket.outputStream);
                    sendMessage(JSON.stringify(reqObj));

                }, function (e) {
                    //var errorStatus = Windows.Networking.Sockets.WebSocketError.getStatus(e.number);
                    WinJS.log && WinJS.log("Failed to connect: " + getError(e), "sample", "error");
                    cberror({ message: "Failed to connect: " + getError(e) });
                });
            }
            else {
                WinJS.log && WinJS.log("Already Connected", "sample", "status");
                sendMessage(JSON.stringify(reqObj));
            }


        });
    }

    function CallMethod(methodName, params) {
        return new WinJS.Promise(function (complete, error) {
            Send(methodName, params).then(function (response) {
                complete(response.result);
            }, function (e) {
                error(e);
            });
        });
    }
    function _videoLibrary_GetMovies(params) {
        return CallMethod("VideoLibrary.GetMovies", params);
    }
    WinJS.Namespace.define("JSONRPC", {
        VideoLibrary: WinJS.Class.define({
            getMovies: _videoLibrary_GetMovies,
        }),
    });
})();