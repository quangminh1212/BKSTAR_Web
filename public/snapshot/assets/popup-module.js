(function ($) {
    "use strict";

    let KingAddonsPB_Popups = {

        init: function () {
            $(document).ready(function () {
                if (!$('.king-addons-pb-template-popup').length || KingAddonsPB_Popups.editorCheck()) {
                    return;
                }
                KingAddonsPB_Popups.openPopupInit();
                KingAddonsPB_Popups.closePopupInit();
            });
        },

        openPopupInit: function () {
            $('.king-addons-pb-template-popup').each(function () {
                let popup = $(this),
                    popupID = KingAddonsPB_Popups.getID(popup);

                if (!KingAddonsPB_Popups.checkAvailability(popupID)) {
                    return;
                }

                if (!KingAddonsPB_Popups.checkStopShowingAfterDate(popup)) {
                    return;
                }

                KingAddonsPB_Popups.setLocalStorage(popup, 'show');

                let getLocalStorage = JSON.parse(localStorage.getItem('KingAddonsPB_PopupSettings')),
                    settings = getLocalStorage[popupID];

                if (!KingAddonsPB_Popups.checkAvailableDevice(popup, settings)) {
                    return false;
                }

                KingAddonsPB_Popups.popupTriggerInit(popup);

                if ('load' === settings.popup_trigger) {
                    let loadDelay = settings.popup_load_delay * 1000;

                    $(window).on('load', function () {
                        setTimeout(function () {
                            KingAddonsPB_Popups.openPopup(popup, settings);
                        }, loadDelay);
                    });

                } else if ('scroll' === settings.popup_trigger) {
                    $(window).on('scroll', function () {

                        let scrollPercent = Math.round(($(window).scrollTop() / ($(document).height() - $(window).height())) * 100);

                        // noinspection JSUnresolvedReference
                        if (scrollPercent >= settings.popup_scroll_progress && !popup.hasClass('king-addons-pb-popup-open')) {
                            KingAddonsPB_Popups.openPopup(popup, settings);
                        }
                    });

                } else if ('element-scroll' === settings.popup_trigger) {
                    $(window).on('scroll', function () {
                        // noinspection JSUnresolvedReference
                        let element = $(settings.popup_element_scroll),
                            ScrollBottom = $(window).scrollTop() + $(window).height();

                        if (!element.length) {
                            return;
                        }

                        if (element.offset().top < ScrollBottom && !popup.hasClass('king-addons-pb-popup-open')) {
                            KingAddonsPB_Popups.openPopup(popup, settings);
                        }
                    });

                } else if ('date' === settings.popup_trigger) {
                    // noinspection JSUnresolvedReference
                    let nowDate = Date.now(),
                        startDate = Date.parse(settings.popup_specific_date);

                    if (startDate < nowDate) {

                        setTimeout(function () {
                            KingAddonsPB_Popups.openPopup(popup, settings);
                        }, 1000);
                    }

                } else if ('inactivity' === settings.popup_trigger) {
                    // noinspection JSUnresolvedReference
                    let idleTimer = null,
                        inactivityTime = settings.popup_inactivity_time * 1000;

                    // noinspection DuplicatedCode
                    $('*').bind('mousemove click keyup scroll resize', function () {
                        if (popup.hasClass('king-addons-pb-popup-open')) {
                            return;
                        }

                        clearTimeout(idleTimer);

                        idleTimer = setTimeout(function () {
                            KingAddonsPB_Popups.openPopup(popup, settings);
                        }, inactivityTime);
                    });

                    $('body').trigger('mousemove');

                } else if ('exit' === settings.popup_trigger) {
                    $(document).on('mouseleave', 'body', function () {
                        if (!popup.hasClass('king-addons-pb-popup-open')) {
                            KingAddonsPB_Popups.openPopup(popup, settings);
                        }
                    });

                } else if ('custom' === settings.popup_trigger) {
                    // noinspection JSUnresolvedReference
                    $(settings.popup_custom_trigger).on('click', function () {
                        KingAddonsPB_Popups.openPopup(popup, settings);
                    });

                    // noinspection JSUnresolvedReference
                    $(settings.popup_custom_trigger).css('cursor', 'pointer');
                }

                if ('0px' !== popup.find('.king-addons-pb-popup-container-inner').css('height')) {
                    new PerfectScrollbar(popup.find('.king-addons-pb-popup-container-inner')[0], {
                        suppressScrollX: true
                    });
                }
            });
        },

        openPopup: function (popup, settings) {
            if ('notification' === settings.popup_display_as) {
                popup.addClass('king-addons-pb-popup-notification');

                setTimeout(function () {
                    $('body').animate({
                        'padding-top': popup.find('.king-addons-pb-popup-container').outerHeight() + 'px'
                    }, settings.popup_animation_duration * 1000, 'linear');
                }, 10);
            }

            // noinspection JSUnresolvedReference
            if (settings.popup_disable_page_scroll && 'modal' === settings.popup_display_as) {
                $('body').css('overflow', 'hidden');
            }

            popup.addClass('king-addons-pb-popup-open').show();
            popup.find('.king-addons-pb-popup-container').addClass('animated ' + settings.popup_animation);

            $(window).trigger('resize');

            $('.king-addons-pb-popup-overlay').hide().fadeIn();

            popup.find('.king-addons-pb-popup-close-btn').css('opacity', '0');

            // noinspection JSUnresolvedReference
            setTimeout(function () {
                popup.find('.king-addons-pb-popup-close-btn').animate({
                    'opacity': '1'
                }, 500);
            }, settings.popup_close_button_display_delay * 1000);

            // noinspection JSUnresolvedReference
            if (false !== settings.popup_automatic_close_switch) {
                // noinspection JSUnresolvedReference
                setTimeout(function () {
                    KingAddonsPB_Popups.closePopup(popup);
                }, settings.popup_automatic_close_delay * 1000);
            }
        },

        closePopupInit: function () {
            $('.king-addons-pb-popup-close-btn').on('click', function () {
                KingAddonsPB_Popups.closePopup($(this).closest('.king-addons-pb-template-popup'));
            });

            $('.king-addons-pb-popup-overlay').on('click', function () {
                let popup = $(this).closest('.king-addons-pb-template-popup'),
                    popupID = KingAddonsPB_Popups.getID(popup),
                    settings = KingAddonsPB_Popups.getLocalStorage(popupID);

                // noinspection JSUnresolvedReference
                if (false === settings.popup_overlay_disable_close) {
                    KingAddonsPB_Popups.closePopup(popup);
                }
            });

            $(document).on('keyup', function (event) {
                let popup = $('.king-addons-pb-popup-open');

                if (popup.length) {
                    let popupID = KingAddonsPB_Popups.getID(popup),
                        settings = KingAddonsPB_Popups.getLocalStorage(popupID);

                    // noinspection JSUnresolvedReference
                    if (27 === event.keyCode && false === settings.popup_disable_esc_key) {
                        KingAddonsPB_Popups.closePopup(popup);
                    }
                }
            });
        },

        closePopup: function (popup,) {
            let popupID = KingAddonsPB_Popups.getID(popup),
                settings = KingAddonsPB_Popups.getLocalStorage(popupID);

            let body = $('body');

            if ('notification' === settings.popup_display_as) {
                body.css('padding-top', 0);
            }

            KingAddonsPB_Popups.setLocalStorage(popup, 'hide');

            if ('modal' === settings.popup_display_as) {
                popup.fadeOut();
            } else {
                popup.hide();
            }

            body.css('overflow', 'visible');

            $(window).trigger('resize');
        },

        popupTriggerInit: function (popup) {
            let popupTrigger = popup.find('.king-addons-pb-popup-trigger-button');

            if (!popupTrigger.length) {
                return;
            }

            popupTrigger.on('click', function () {
                let settings = JSON.parse(localStorage.getItem('KingAddonsPB_PopupSettings')) || {};
                let popupTriggerType = $(this).attr('data-trigger'),
                    popupShowDelay = $(this).attr('data-show-delay'),
                    popupRedirect = $(this).attr('data-redirect'),
                    popupRedirectURL = $(this).attr('data-redirect-url'),
                    popupID = KingAddonsPB_Popups.getID(popup);

                // noinspection DuplicatedCode
                if ('close' === popupTriggerType) {
                    settings[popupID].popup_show_again_delay = parseInt(popupShowDelay, 10);
                    settings[popupID].popup_close_time = Date.now();
                } else if ('close-permanently' === popupTriggerType) {
                    settings[popupID].popup_show_again_delay = parseInt(popupShowDelay, 10);
                    settings[popupID].popup_close_time = Date.now();
                } else if ('back' === popupTriggerType) {
                    window.history.back();
                }

                KingAddonsPB_Popups.closePopup(popup);

                localStorage.setItem('KingAddonsPB_PopupSettings', JSON.stringify(settings));

                if ('back' !== popupTriggerType && 'yes' === popupRedirect) {
                    setTimeout(function () {
                        window.location.href = popupRedirectURL;
                    }, 100);
                }
            });

        },

        getLocalStorage: function (id) {
            let getLocalStorage = JSON.parse(localStorage.getItem('KingAddonsPB_PopupSettings'));

            if (null == getLocalStorage) {
                return false;
            }

            let settings = getLocalStorage[id];

            if (null == settings) {
                return false;
            }

            return settings;
        },

        setLocalStorage: function (popup, display) {
            let popupID = KingAddonsPB_Popups.getID(popup);
            let settings = JSON.parse(localStorage.getItem('KingAddonsPB_PopupSettings')) || {};

            settings[popupID] = JSON.parse(popup.attr('data-settings'));

            if ('hide' === display) {
                settings[popupID].popup_close_time = Date.now();
            } else {
                settings[popupID].popup_close_time = false;
            }

            localStorage.setItem('KingAddonsPB_PopupSettings', JSON.stringify(settings));
        },

        checkStopShowingAfterDate: function (popup) {
            let settings = JSON.parse(popup.attr('data-settings'));
            let currentDate = Date.now();

            // noinspection JSUnresolvedReference
            if ('yes' === settings.popup_stop_after_date) {
                // noinspection JSUnresolvedReference
                if (currentDate >= Date.parse(settings.popup_stop_after_date_select)) {
                    return false;
                }
            }

            return true;
        },

        checkAvailability: function (id) {
            let popup = $('#king-addons-pb-popup-id-' + id),
                dataSettings = JSON.parse(popup.attr('data-settings')),
                currentURL = window.location.href;

            // noinspection JSUnresolvedReference
            if ('yes' === dataSettings.popup_show_via_referral && -1 === currentURL.indexOf('king_addons_ext_pb=user-popup')) {
                // noinspection JSUnresolvedReference
                if (currentURL.indexOf(dataSettings.popup_referral_keyword) === -1) {
                    return;
                }
            }

            if (false === KingAddonsPB_Popups.getLocalStorage(id)) {
                return true;
            }

            let trigger = popup.find('.king-addons-pb-popup-trigger-button'),
                triggerShowDelay = trigger.attr('data-show-delay');

            let currentDate = Date.now();
            let settings = KingAddonsPB_Popups.getLocalStorage(id);

            if (triggerShowDelay) {

                let permanent = true;

                trigger.each(function () {
                    let delay = $(this).attr('data-show-delay');

                    if (settings.popup_show_again_delay === parseInt(delay, 10)) {
                        permanent = false;
                    }
                });

                if (true === permanent) {
                    return true;
                }
            } else {
                if (settings.popup_show_again_delay !== dataSettings.popup_show_again_delay) {
                    return true;
                }
            }

            let closeDate = settings.popup_close_time || 0,
                showDelay = parseInt(settings.popup_show_again_delay, 10);

            return closeDate + showDelay < currentDate;
        },

        checkAvailableDevice: function (popup, settings) {
            let viewport = $('body').prop('clientWidth');

            if (viewport > 1024) {
                // noinspection JSUnresolvedReference
                return Boolean(settings.popup_show_on_device);
            } else if (viewport > 768) {
                // noinspection JSUnresolvedReference
                return Boolean(settings.popup_show_on_device_tablet);
            } else {
                // noinspection JSUnresolvedReference
                return Boolean(settings.popup_show_on_device_mobile);
            }
        },

        getID: function (popup) {
            let id = popup.attr('id');

            return id.replace('king-addons-pb-popup-id-', '');
        },

        editorCheck: function () {
            return !!$('body').hasClass('elementor-editor-active');
        }
    }

    KingAddonsPB_Popups.init();

}(jQuery, window.elementorFrontend));