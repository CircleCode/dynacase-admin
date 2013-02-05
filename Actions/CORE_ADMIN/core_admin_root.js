(function ($, window, document) {
    "use strict";
    var emptyIframeUrl = 'about:blank',
        onResize,
        reportError,
        loadApplication,
        loadAction,
        getIframe,
        unload,
        injectActionsList,
        generateUUID;

    reportError = function reportError(err) {
        if (window.console && window.console.log) {
            window.console.log(err);
        }
    };

    onResize = function onResize() {
        var contentOffset, $window = $(window), windowHeight, $content = $("#content"), $sidebar = $("#sidebar");
        contentOffset = $content.offset();
        windowHeight = $window.height();

        $content.outerWidth($window.width() - contentOffset.left);
        $content.outerHeight(windowHeight - contentOffset.top);

        $sidebar.outerHeight(windowHeight - $sidebar.offset().top);
    };

    getIframe = function getIframe(iframeId, url) {
        var $iframe;
        $iframe = $('#' + iframeId);
        if (!$iframe.length) {
            if (url) {
                $iframe = $('<iframe id="' + iframeId + '" src="' + url + '"></iframe>')
                    .on(
                        "load",
                        function unloadIframe() {
                            var $this = $(this), doc, $loadedElement;
                            doc = this.contentDocument || this.contentWindow.document;
                            if (doc
                                    && doc.location
                                    && doc.location.href
                                    && doc.location.href === emptyIframeUrl) {
                                $this.empty().remove();
                                $loadedElement = $('li[data-iframeid="' + this.id + '"]');
                                $loadedElement.removeClass("loaded ui-state-highlight");
                            }
                        }
                    )
                    .hide()
                    .appendTo('#content');
            } else {
                reportError("no url");
            }
        }
        return $iframe;
    };

    loadApplication = function loadApplication($app) {
        var $adminActionsList, appName, appUrl, iframeId, rootActionName, url, $iframe;
        $adminActionsList = $('.admin-actions', $app);
        if ($adminActionsList.length) {
            injectActionsList($app);
        } else {
            appName = $app.data("appname");
            appUrl = $app.data("appurl");
            iframeId = $app.data("iframeid");
            if (!iframeId) {
                iframeId = 'app-' + appName;
                $app.attr('data-iframeid', iframeId);
            }
            rootActionName = $app.data("rootaction");
            url = appUrl + '&action=' + rootActionName;
            $iframe = getIframe(iframeId, url);
            $iframe.siblings()
                .hide();
            $iframe.show();
            $('.ui-state-highlight', $("#sidebar")).removeClass("ui-state-highlight");
            $app.addClass("loaded ui-state-highlight");
        }
    };

    loadAction = function loadAction($action) {
        var iframeId, actionUrl, $iframe;
        iframeId = $action.data("iframeid");
        if (!iframeId) {
            iframeId = 'action-' + generateUUID();
            $action.attr('data-iframeid', iframeId);
        }
        actionUrl = $action.data("url");

        $iframe = getIframe(iframeId, actionUrl);
        $iframe.siblings()
            .hide();
        $iframe.show();
        $('.ui-state-highlight', $("#sidebar")).removeClass("ui-state-highlight");
        $action.addClass("loaded ui-state-highlight");
    };

    unload = function unload($iframe) {
        var iframeId, $loadedElement;
        $iframe.attr('src', emptyIframeUrl);
        iframeId = $iframe[0].id;
        $loadedElement = $('li[data-iframeid="' + iframeId + '"]');
        $loadedElement.removeClass("loaded ui-state-highlight");
    };

    injectActionsList = function injectActionsList($app) {
        var appName, actionsList, i, length, title, action, actionsListBody = "";
        if ($app.hasClass("admin-actions-loaded")) {
            return;
        }
        appName = $app.data('appname');
        $('.admin-actions', $app).show();
        $.getJSON(
            window.location.protocol + '//' + window.location.host + window.location.pathname,
            {
                app: appName,
                action: 'ADMIN_ACTIONS_LIST'
            }
        ).pipe(
            function onSuccess(response) {
                if (response.success) {
                    return (response);
                }
                return ($.Deferred().reject(response));
            },
            function onError(response) {
                return ({
                    success: false,
                    body: null,
                    error: "Unexpected error: " + response.status + " " + response.statusText
                });
            }
        ).done(function (response) {
            actionsList = response.body;
            for (i = 0, length = actionsList.length; i < length; i += 1) {
                if (!actionsList[i].url || !actionsList[i].label) {
                    reportError("actions list contains an item with no label or no url");
                }
                title = actionsList[i].title || '';
                action = '<li class="admin-action selectable" title="' + title + '" data-url="' + actionsList[i].url + '"><span class="admin-action-label">' + actionsList[i].label + '</span><span class="btn-close">×</span></li>';
                actionsListBody += action;
            }
            $('.admin-actions', $app)
                .empty()
                .append($(actionsListBody));
            $app.removeClass("selectable ui-state-hover").addClass("admin-actions-loaded");
        }).fail(function (response) {
            reportError(response.error);
        });
    };

    generateUUID = function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    $(document).ready(function () {

        $("#sidebar").on(
            'click',
            '.app',
            function appSelected() {
                loadApplication($(this));
            }
        ).on(
            'click',
            '.admin-action',
            function actionSelected() {
                loadAction($(this));
                return false;
            }
        ).on(
            'click',
            '.btn-close',
            function itemClosed() {
                var $item, $iframe;
                $item = $(this).closest("[data-iframeid]");
                $iframe = $("#" + $item.data("iframeid"));
                $iframe.attr('src', emptyIframeUrl);
                return false;
            }
        ).on(
            "mouseenter",
            ".selectable",
            function () {
                $(this).addClass("ui-state-hover");
            }
        ).on(
            "mouseleave",
            ".selectable",
            function () {
                $(this).removeClass("ui-state-hover");
            }
        );

        /**
         * resize items on window resize
         */
        $(window).on(
            'resize',
            onResize
        );
        window.setTimeout(onResize, 1);

        /**
         * Disconnect button
         */
        $("#disconnect").button({
            icons: {
                primary: "ui-icon-power"
            },
            text: false
        }).on("click", function () {
            $("#disconnect-form").trigger("submit");
        });

        /**
         * Change password button
         */
        window.setTimeout(function () {
            $("#userButton")
                .passwordModifier()
                .on(
                    "mouseenter",
                    function () {
                        $(this).addClass("ui-state-hover");
                    }
                ).on(
                    "mouseleave",
                    function () {
                        $(this).removeClass("ui-state-hover");
                    }
                );
        }, 0);
    });

}($, window, document));