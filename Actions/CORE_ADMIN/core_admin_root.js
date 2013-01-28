(function ($, window, document) {
    "use strict";
    var emptyIframeUrl = 'about:blank',
        unselectApplication,
        unloadApplication,
        onResize,
        getApplicationIFrame,
        selectApplication,
        loadApplication;

    unselectApplication = function unselectApplication($app) {
        $app.removeClass("selected");
    };

    unloadApplication = function unloadApplication($app) {
        var appName, applicationIframe, appurl;
        appName = $app.data('appname');
        appurl = $app.data('appurl');
        applicationIframe = getApplicationIFrame(appName, appurl);
        applicationIframe.attr('src', emptyIframeUrl);
    };

    onResize = function onResize() {
        var contentOffset, $window = $(window), windowHeight, $content = $("#content"), $sidebar = $("#sidebar");
        contentOffset = $content.offset();
        windowHeight = $window.height();

        $content.outerWidth($window.width() - contentOffset.left);
        $content.outerHeight(windowHeight - contentOffset.top);

        $sidebar.outerHeight(windowHeight - $sidebar.offset().top);
    };

    getApplicationIFrame = function getApplicationIFrame(appName, appUrl) {
        var iframeId, applicationIframe;
        iframeId = 'app-iframe-' + appName;
        applicationIframe = $('#' + iframeId);
        if (!applicationIframe.length) {
            applicationIframe = $('<iframe id="' + iframeId + '" src="' + appUrl + '"></iframe>')
                .on(
                    "load",
                    (function (appName) {
                        return function unloadIframe() {
                            var $this = $(this), doc, $app;
                            doc = this.contentDocument || this.contentWindow.document;
                            if (doc
                                    && doc.location
                                    && doc.location.href
                                    && doc.location.href === emptyIframeUrl) {
                                $this.empty().remove();
                                $app = $('.app[data-appname=' + appName + ']', $('#sidebar'))
                                    .removeClass('loaded');
                                unselectApplication($app);
                            }
                        };
                    }(appName))
                )
                .hide()
                .appendTo('#content');
        }
        return applicationIframe;
    };

    selectApplication = function selectApplication($app) {
        $app.addClass("selected")
            .siblings()
            .removeClass("selected");
    };

    loadApplication = function loadApplication($app) {
        var appName, applicationIframe, appurl;
        appName = $app.data('appname');
        appurl = $app.data('appurl');
        applicationIframe = getApplicationIFrame(appName, appurl);
        applicationIframe.siblings()
            .hide();
        applicationIframe.show();
        $app.addClass("loaded");
        return true;
    };

    $(document).ready(function () {
        window.setTimeout(onResize, 1);
        /* Password */
        window.setTimeout(function () {
            $("#userButton").passwordModifier();
        }, 0);
        $("#userButton").on("mouseenter", function () {
            $(this).addClass("ui-state-hover");
        }).on("mouseleave", function () {
            $(this).removeClass("ui-state-hover");
        });
        $("#sidebar").on(
            'click',
            '.app',
            function appSelected() {
                var $this = $(this);
                if (loadApplication($this)) {
                    selectApplication($this);
                }
            }
        ).on(
            'click',
            '.btn-close',
            function appClosed() {
                var $app = $(this).closest('.app');
                unloadApplication($app);
            }
        );
        $(window).on(
            'resize',
            onResize
        );
        $("#disconnect").button({
            icons: {
                primary: "ui-icon-power"
            },
            text: false
        }).on("click", function () {
            $("#authent").trigger("submit");
        });
    });
}($, window, document));