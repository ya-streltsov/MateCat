/*
 Component: mbc.main
 */

MBC = {
    enabled: function () {
        return ( config.comments_enabled && !!window.EventSource );
    }
};

if ( MBC.enabled() )
    (function ( $, config, window, MBC, undefined ) {

        var originalScrollSegment = UI.scrollSegment;
        SSE.init();

        MBC.const = {
            get commentAction() {
                return 'comment';
            }
        };

        MBC.localStorageCommentsClosed =  "commentsPanelClosed-"+config.id_job+config.password

        var types = {sticky: 3, resolve: 2, comment: 1};
        var source_pages = {revise: 2, translate: 1};
        var loggedUserName = null;
        var customUserName = null;
        var lastCommentHash = null;

        var tpls = MBC.const.tpls;

        var initConstants = function () {
            tpls = MBC.const.tpls;
        };

        var db = {
            segments: {},
            history: {},
            refreshHistory: function () {

                function includeInHistory( comment ) {
                    return Number( comment.message_type ) == types.comment &&
                            sids.indexOf( comment.id_segment ) === -1
                }

                this.history = [];
                this.history_count = 0;
                var comment;
                var sids = [];

                for ( var i in this.segments ) {
                    if ( isNaN( i ) ) {
                        continue;
                    }

                    var new_array = this.segments[i].slice(); // quick clone
                    new_array.reverse();

                    for ( var ii in new_array ) {
                        comment = new_array[ii];

                        if ( includeInHistory( comment ) ) {
                            this.history_count++;
                            this.history.push( comment );
                            sids.push( comment.id_segment );
                        }
                    }
                }

                this.history.sort( function ( x, y ) {
                    return x.timestamp - y.timestamp;
                } );
            },

            resetSegments: function () {
                this.segments = {};
            },

            storeSegments: function ( array ) {
                for ( var i = 0; i < array.length; i++ ) {
                    this.pushSegment( array[i] );
                }
            },

            pushSegment: function ( data ) {
                var s = Number( data.id_segment );

                if ( typeof db.segments[s] === 'undefined' ) {
                    db.segments[s] = [data];
                }
                else {
                    db.segments[s].push( data );
                }
                if ( Number( data.message_type ) == types.resolve ) {
                    $( db.segments[s] ).each( function ( i, x ) {
                        if ( x.thread_id == null ) {
                            x.thread_id = data.thread_id
                        }
                    } );
                }
            },

            getCommentsBySegment: function ( s ) {
                var s = Number( s );

                if ( typeof this.segments[s] === 'undefined' ) {
                    return [];
                } else {
                    return this.segments[s];
                }
            },

            getCommentsCountBySegment: function ( s ) {
                var active = 0, total = 0;

                $( this.getCommentsBySegment( s ) ).each( function ( i, x ) {
                    if ( Number( x.message_type ) == types.comment ) {
                        if ( null == x.thread_id ) active++;
                        total++;
                    }
                } );
                return {active: active, total: total};
            }
        };

        var source = SSE.getSource( 'comments' );

        source.addEventListener( 'message', function ( e ) {
            var message = new SSE.Message( JSON.parse( e.data ) );
            if ( message.isValid() ) {
                $( document ).trigger( message.eventIdentifier, message );
            }
        }, false );

        var getUsername = function () {
            if ( customUserName ) return customUserName;
            if ( loggedUserName ) return loggedUserName;
            return 'Anonymous';
        };

        var getSourcePage = function () {
            if ( config.isReview ) {
                return source_pages.revise;
            }
            else {
                return source_pages.translate;
            }
        };

        var limitNum = function ( num ) {
            if ( Number( num ) > 99 ) return '+99';
            else return num;
        };

        var buildFirstCommentHeader = function () {
            return $( tpls.firstCommentWrap );
        };

        var popLastCommentHash = function () {
            var l = lastCommentHash;
            lastCommentHash = null;
            return l;
        };

        var resolveCommentLinkIcon = function ( el, comments_obj ) {
            var root = $( el ).find( '.txt' );
            root.hide();

            if ( comments_obj.total == 0 ) {
                root.append( $( tpls.commentIconHighlightInvite ) );
                return;
            }

            root.find( '.mbc-comment-highlight-invite' ).remove();
            root.find( '.mbc-comment-highlight' ).remove();

            var highlight = $( tpls.commentIconHighlightNumber );

            if ( comments_obj.active > 0 ) {
                root.append( highlight );
                root.addClass('has-object');
                highlight.text( limitNum( comments_obj.active ) );
            }

            root.show();
        };

        var renderInputForm = function () {
            var inputForm = $( tpls.inputForm );
            inputForm.find( '.mbc-new-message-notification' ).hide();
            inputForm.find( '.mbc-comment-username' )
                    .toggleClass( 'mbc-comment-anonymous-label', !loggedUserName )
                    .text( getUsername() );

            if ( loggedUserName ) {
                inputForm.find( '.mbc-login-link' ).addClass( 'mbc-hide' );
            } else {
                inputForm.find( '.mbc-login-link' ).addClass( 'mbc-visible' );
                inputForm.find( '.mbc-comment-username' )
                        .attr( 'title', 'Click to edit' );
            }
            inputForm.find( '.mbc-comment-send-btn' ).hide();
            return inputForm;
        };

        var renderSegmentCommentsFirstInput = function ( el ) {
            $( '.mbc-comment-balloon-outer' ).remove();

            var root = $( tpls.segmentThread );
            var inputForm = renderInputForm();

            inputForm.addClass( 'mbc-first-input' );

            root.find( '.mbc-comment-balloon-inner' ).append( inputForm );

            el.find('.segment-side-container').prepend( root.show() );
            addTagging();
            inputForm.find( 'textarea' ).focus();
        };

        var populateCommentsWrap = function ( root, comments ) {
            var comments_root = root.find( '.mbc-comments-wrap' );

            if ( comments.length == 0 ) {
                return root;
            }
            var thread_wrap = null, thread_id = 0, count = 0;

            for ( var i = 0; i < comments.length; i++ ) {
                if ( comments[i].thread_id != thread_id ) {
                    // start a new thread
                    if ( thread_wrap != null ) {
                        comments_root.append( thread_wrap );
                        count = 0;
                    }
                    thread_wrap = $( tpls.threadWrap );
                }
                if ( Number( comments[i].message_type ) == types.comment ) {
                    count++;
                }
                if ( comments[i].thread_id == null ) {
                    thread_wrap.addClass( 'mbc-thread-wrap-active' );
                }
                else {
                    thread_wrap.addClass( 'mbc-thread-wrap-resolved' );
                }
                thread_wrap.append( populateCommentTemplate( comments[i] ) );
                thread_wrap.data( 'count', count );

                thread_id = comments[i].thread_id;
            }

            comments_root.append( thread_wrap );
        };

        var populateWithComments = function ( root, comments ) {
            populateCommentsWrap( root, comments );

            function threadIsResolved() {
                return comments[comments.length - 1].thread_id;
            }

            if ( !threadIsResolved() ) {
                root.find( '.mbc-thread-wrap-active' ).append( $( tpls.resolveButton ) );
            }
            return root;
        };

        var Scrollable = function ( el ) {
            this.el = el;
            var that = this;
            var root = $( el ).closest( '.mbc-comment-balloon-outer' );
            var notificationArea = $( root ).find( '.mbc-new-message-notification' );
            var dataRoot = root.closest( 'section' );

            $( this.el ).on( 'scroll', function () {
                if ( that.bottomVisible() ) hideNotificationAndResetCount();
            } );


            this.bottomVisible = function () {
                return el.scrollTop + 30 >= el.scrollHeight - el.clientHeight;
            };

            var verbalize = function ( count ) {
                if ( count > 1 )  return '' + count + ' new messages';
                else            return '1 new message';
            };

            this.notifyNewComments = function () {
                var count = dataRoot.data( 'mbc-new-comments-count' ) || 0;
                dataRoot.data( 'mbc-new-comments-count', ++count );

                notificationArea.find( 'a' ).text( verbalize( count ) );
                notificationArea.show();
            };

            this.scrollToBottom = function () {
                $( this.el ).scrollTop( this.el.scrollHeight );
                hideNotificationAndResetCount();
            };

            var hideNotificationAndResetCount = function () {
                notificationArea.hide();
                dataRoot.data( 'mbc-new-comments-count', 0 );
            }
        };

        var renderSegmentComments = function ( el ) {
            $( '.mbc-comment-balloon-outer' ).remove();

            var segment = new UI.Segment( el );
            var comments = db.getCommentsBySegment( segment.absoluteId );
            var root = $( tpls.segmentThread );

            populateWithComments( root, comments );

            var inputForm = renderInputForm();
            inputForm.addClass( 'mbc-reply-input' );
            root.find( '.mbc-comment-balloon-inner' ).append( inputForm );
            el.find('.segment-side-container').prepend( root.show() );
            addTagging();
        };

        var renderOnlySegmentsWrap = function ( el ) {
            var segment = new UI.Segment( el );
            var comments = db.getCommentsBySegment( segment.absoluteId );
            var root = $( '.mbc-comment-balloon-outer' );
            $( root ).find( '.mbc-comments-wrap' ).empty();
            populateWithComments( root, comments );
            //populateCommentsWrap(root, comments);
        };

        var appendReceivedMessage = function ( el ) {
            var areaBefore = new Scrollable( $( el ).find( '.mbc-comments-wrap' )[0] );
            var scrollTop = areaBefore.el.scrollTop;
            var scrollableArea;

            if ( !areaBefore.bottomVisible() ) {

                renderOnlySegmentsWrap( el );

                scrollableArea = new Scrollable( $( el ).find( '.mbc-comments-wrap' )[0] );
                el; /// XXX seems to be required to get actual scrollTop number
                $( scrollableArea.el ).scrollTop( scrollTop );
                scrollableArea.notifyNewComments();
            } else {
                renderOnlySegmentsWrap( el );
                scrollableArea = new Scrollable( $( el ).find( '.mbc-comments-wrap' )[0] );
                scrollableArea.scrollToBottom();
            }

            el.find( '.mbc-thread-wrap-active .mbc-show-comment:last' ).effect( 'highlight', {}, 1000 );
        };

        var appendSubmittedMessage = function ( el ) {
            renderSegmentComments( el );
            var scrollableArea = new Scrollable( el.find( '.mbc-comments-wrap' )[0] );
            scrollableArea.scrollToBottom();
        };

        var renderSegmentBalloon = function ( el ) {
            var segment = new UI.Segment( el );
            var comments = db.getCommentsBySegment( segment.absoluteId );
            var index = $('section').index(el);
            if ( comments.length > 0 ) {
                if ( index < 3 ) {
                    $('article').first().addClass('comment-opened-'+ index);
                }
                renderSegmentComments( el );
                var scrollableArea = new Scrollable( el.find( '.mbc-comments-wrap' )[0] );
                scrollableArea.scrollToBottom();
            } else {
                renderSegmentCommentsFirstInput( el );
                if ( index === 0 ) {
                    $('article').first().addClass('comment-opened-empty-'+ index);
                }
            }
        };

        var scrollSegment = function ( section ) {
            if ($('article.mbc-commenting-opened').length > 0 ) {

                var scrollAnimation = $( UI.scrollSelector );
                var segment = section;
                var pos = 0;
                var article = segment.closest('article');

                pos = segment.offset().top - segment.offsetParent('#outer').offset().top;

                if (article.prevAll('article').length > 0) {
                    _.forEach(article.prevAll('article'), function ( item ) {
                        pos = pos + $(item).outerHeight() + 140;
                    });
                }
                pos = pos - 220;
                scrollAnimation.animate({
                    scrollTop: pos
                }, 200);
                return scrollAnimation.promise() ;
            } else {
                return originalScrollSegment.apply(this, arguments);
            }
        };

        var openSegmentComment = function ( el ) {
            $( 'article' ).addClass( 'mbc-commenting-opened' );
            $( 'body' ).addClass( 'side-tools-opened' );
            el.find('.mbc-comment-icon-button').css("visibility", "hidden");
            popLastCommentHash();
            $( 'article' ).removeClass('comment-opened-0').removeClass('comment-opened-1').removeClass('comment-opened-2').removeClass('comment-opened-empty-0');
            setTimeout(function(){
                if ( el.hasClass("opened") ) {
                    renderSegmentBalloon( el );
                } else {
                    scrollSegment( el ).done( function() {
                        renderSegmentBalloon( el );
                    });
                }
            });
            localStorage.setItem(MBC.localStorageCommentsClosed, false);
        };

        var openSegmentCommentNoScroll = function ( el ) {
            $( 'article' ).addClass( 'mbc-commenting-opened' );
            $( 'body' ).addClass( 'side-tools-opened' );
            $('.mbc-comment-icon-button').css("visibility", "");
            el.find('.mbc-comment-icon-button').css("visibility", "hidden");
            $( 'article' ).removeClass('comment-opened-0').removeClass('comment-opened-1').removeClass('comment-opened-2').removeClass('comment-opened-empty-0');
            renderSegmentBalloon( el );
            localStorage.setItem(MBC.localStorageCommentsClosed, false);
        };

        var closeBalloon = function (segmentClose) {
            $('article').first().removeClass('comment-opened-0').removeClass('comment-opened-1').removeClass('comment-opened-2').removeClass('comment-opened-empty-0');
            $( '.mbc-comment-balloon-outer' ).remove();
            $( 'article' ).removeClass( 'mbc-commenting-opened' );
            $( 'body' ).removeClass( 'side-tools-opened' );
            $('.mbc-comment-icon-button').css("visibility", "");
            if (!segmentClose) {
                localStorage.setItem(MBC.localStorageCommentsClosed, true);
            }
        };

        var renderCommentIconLink = function ( el ) {
            var segment = new UI.Segment( el );

            if ( (!segment.isSplit()) || segment.isFirstOfSplit() ) {
                $( document ).trigger( 'mbc:segment:update:links', segment.absoluteId );
            }
        };

        var renderCommentIconLinks = function () {
            $( 'section' ).each( function ( i, el ) {
                renderCommentIconLink( el );
            } );
        };

        var populateCommentTemplate = function ( data ) {
            if ( Number( data.message_type ) == types.resolve ) {
                var root = $( tpls.showResolve );
                root.find( '.mbc-comment-username' ).text( htmlDecode( data.full_name ) );
            } else {
                var root = $( tpls.showComment );
                root.find( '.mbc-comment-username' ).text( htmlDecode( data.full_name ) );
                root.find( '.mbc-comment-time' ).text( data.formatted_date );
                var text = nl2br( data.message );
                text = parseCommentHtml(text);
                root.find( '.mbc-comment-body' ).html( text );
                if ( data.email != null ) {
                    root.find( '.mbc-comment-email-label' ).text( data.email );
                }
            }
            return root;
        };

        var nl2br = function ( str, is_xhtml ) {
            var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
            return (str + '').replace( /([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2' );
        };

        var nothingToSubmit = function () {
            return $.trim( $( '.mbc-comment-textarea' ).text() ) == '';
        };

        var ajaxResolveSuccess = function ( resp ) {
            db.pushSegment( resp.data.entries[0] );
            $( document ).trigger( 'mbc:comment:new', resp.data.entries[0] );
        };

        var refreshUserInfo = function ( user ) {
            if ( typeof user === 'undefined' ) {
                loggedUserName = null;
            } else {
                loggedUserName = user.full_name;
            }
        };

        var renderHistoryWithNoComments = function () {
            $( '.mbc-history-balloon-has-comment' ).remove();
            $( '.mbc-history-balloon-has-no-comments' ).show();
            $( '.mbc-comment-highlight-history' ).removeClass( 'mbc-visible' );
        };

        var renderHistoryWithComments = function () {
            var root = $( tpls.historyHasComments );
            var count = 1;
            var comment;

            for ( var i in db.history ) {
                comment = db.history[i];

                var viewButton = $( tpls.historyViewButton );
                viewButton.find( 'a' ).text( 'View thread' );
                viewButton.attr( 'data-id', comment.id_segment );

                var segmentLabel = $( tpls.historySegmentLabel );

                segmentLabel.find( '.mbc-comment-segment-number' ).text( comment.id_segment );
                //segmentLabel.closest('.mbc-nth-comment').text( count++ );

                var line = populateCommentTemplate( comment );

                line.append( viewButton );
                line.prepend( segmentLabel );

                var wrap = $( tpls.threadWrap ).append( line );

                if ( comment.thread_id == null ) {
                    wrap.addClass( 'mbc-thread-wrap-active' );
                } else {
                    wrap.addClass( 'mbc-thread-wrap-resolved' );
                }

                root.append( wrap );
            }
            $( '.mbc-history-balloon-has-comment' ).remove();
            $( '.mbc-history-balloon-has-no-comments' ).hide();

            $( '.mbc-history-balloon-outer' ).append( root );
        };

        var updateHistoryWithLoadedSegments = function () {
            db.refreshHistory();
            if ( db.history_count == 0 ) {
                $( '#mbc-history' )
                        .addClass( 'mbc-history-balloon-icon-has-no-comments' )
                        .removeClass( 'mbc-history-balloon-icon-has-comment' );
                renderHistoryWithNoComments();
            } else {
                $( '#mbc-history' )
                        .removeClass( 'mbc-history-balloon-icon-has-no-comments' )
                        .addClass( 'mbc-history-balloon-icon-has-comment' );
                renderHistoryWithComments();
            }
        };

        var addTagging = function (  ) {

            if ( MBC.teamUsers && MBC.teamUsers.length > 0 ) {
                $(".mbc-comment-textarea")
                    .atwho({
                        at: "@",
                        displayTpl: '<li>${first_name} ${last_name}</li>',
                        insertTpl: '<span contenteditable="false" class="tagging-item" data-id="${uid}">${first_name} ${last_name}</span>',
                        data: MBC.teamUsers,
                        searchKey: "first_name",
                        limit: MBC.teamUsers.length
                    });
            }
        };

        var parseCommentHtmlBeforeSend = function (  ) {

            var elem = $( '.mbc-comment-textarea' ).clone();
            elem.find(".atwho-inserted").each(function (  ) {
                var id = $(this).find('.tagging-item').data('id');
                $(this).html("{@"+id+"@}");
            });
            elem.find(".tagging-item").remove();
            return elem.text();

        };

        var parseCommentHtml = function ( text ) {
            var regExp = /{@([0-9]+|team)@}/gm;
            if ( regExp.test(text) ) {
                text = text.replace( regExp, function (match, id) {
                    id = (id === "team") ? id : parseInt(id);
                    var user = findUser(id);
                    if (user) {
                        var html = '<span contenteditable="false" class="tagging-item" data-id="'+id+'">'+ user.first_name + ' ' + user.last_name +'</span>';
                        return match.replace(match, html);
                    }
                    return match;
                });
            }

            return text;
        };

        var findUser = function ( id ) {
            return _.find(MBC.teamUsers, function ( item ) {
                return item.uid === id;
            });
        };

        var submitComment = function ( el ) {
            if ( nothingToSubmit() ) return;

            var segment = new UI.Segment( el );

            var text = parseCommentHtmlBeforeSend();

            var data = {
                action: 'comment',
                _sub: 'create',
                id_client: config.id_client,
                id_job: config.id_job,
                id_segment: segment.absoluteId,
                username: getUsername(),
                password: config.password,
                source_page: getSourcePage(),
                message: text,
            };

            $( '.mbc-comment-textarea' ).attr( 'disabled', 'disabled' );

            clearGenericWarning();

            APP.doRequest( {
                data: data,
                success: function ( resp ) {
                    if ( resp.errors.length ) {
                        showGenericWarning();
                    } else {
                        $( document ).trigger( 'mbc:comment:saved', resp.data.entries[0] );
                    }
                },
                error: function () {
                    showGenericWarning();
                },
                always: function () {
                    $( '.mbc-comment-textarea' ).removeAttr( 'disabled' );
                }
            } );
        };

        var showGenericWarning = function () {
            $( '.mbc-ajax-message-wrap' ).show();
        };

        var clearGenericWarning = function () {
            $( '.mbc-ajax-message-wrap' ).hide();
        };

        function enableInputForm( outer ) {
            outer.find( '.mbc-post-comment .mbc-comment-username' )
                    .toggleClass( 'mbc-comment-anonymous-label', !loggedUserName )
                    .text( getUsername() );

            if ( loggedUserName ) outer.find( '.mbc-post-comment .mbc-login-link' ).addClass( 'mbc-hide' );
            else outer.find( '.mbc-post-comment .mbc-login-link' ).addClass( 'mbc-visible' );
        }

        var loadCommentData = function ( success ) {
            var data = {
                action: 'comment',
                _sub: 'getRange',
                id_job: config.id_job,
                first_seg: UI.getSegmentId( UI.firstSegment ),
                last_seg: UI.getSegmentId( UI.lastSegment ),
                password: config.password
            };

            APP.doRequest( {
                data: data,
                success: success,
                error: function () {
                    // TODO: handle error on comments fetch
                }
            } );
        };

        var resetDatabase = function ( resp ) {
            db.resetSegments();
            db.storeSegments( resp.data.entries.comments );
            // db.storeSegments( resp.data.entries.open_comments );
            refreshUserInfo( resp.data.user );
        };

        var initCommentLink = function ( el ) {
            var section = new UI.Segment( el );
            var side_buttons;

            if ( (!section.isSplit()) || section.isFirstOfSplit() ) {
                side_buttons = section.el.find('.segment-side-buttons' );
                side_buttons.find('.mbc-comment-icon').parent('.txt').remove();
                side_buttons.prepend( $(tpls.commentLink ));
            }
        };

        var initCommentLinks = function () {
            $( 'section' ).each( function ( i, el ) {
                initCommentLink( el );
            } );
        };

        var refreshElements = function () {
            initCommentLinks();
            renderCommentIconLinks();
            updateHistoryWithLoadedSegments();
        };

        var getTeamUsers = function (  ) {
            var teamId = config.id_team;
            return $.ajax({
                async: true,
                type: "get",
                // url : "/api/v2/teams/" + teamId + "/members"
                url : "/api/app/teams/" + teamId + "/members/public"
            }).done(function ( data ) {
                var team = {
                    uid: "team",
                    first_name: "Team",
                    last_name: ""
                };
                MBC.teamUsers = data;
                MBC.teamUsers.unshift(team);


            }).fail(function ( response ) {
                MBC.teamUsers = [];
            })
        };

        var checkOpenSegmentComment = function ( id_segment ) {
            if ( db.getCommentsCountBySegment && UI.currentSegmentId === id_segment) {
                var comments_obj = db.getCommentsCountBySegment( id_segment );
                var el = UI.Segment.findEl( id_segment );
                var panelClosed = localStorage.getItem(MBC.localStorageCommentsClosed) == 'true';
                if ( comments_obj.active > 0  && !panelClosed) {
                    openSegmentCommentNoScroll(el);
                    setTimeout(function(){
                        scrollSegment( el )
                    }, 200);
                } else {
                    closeBalloon(true);
                }
            }
        };

        // var resetTextArea = function () {
        //     var maxHeight = 100;
        //     var minHeight = 34;
        //     var borderTopWidth = parseFloat( $( this ).css( "borderTopWidth" ) );
        //     var borderBottomWidth = parseFloat( $( this ).css( "borderBottomWidth" ) );
        //     var borders = borderTopWidth + borderBottomWidth;
        //     var scrollHeightWithBorders = this.scrollHeight + borders;
        //
        //     while ( scrollHeightWithBorders > $( this ).outerHeight() && $( this ).height() < maxHeight ) {
        //         $( this ).height( $( this ).height() + 10 );
        //     }
        //     while ( scrollHeightWithBorders <= $( this ).outerHeight() && $( this ).height() > minHeight ) {
        //         $( this ).height( $( this ).height() - 10 );
        //     }
        //
        //     if ( $( this ).height() >= maxHeight ) {
        //         $( this ).css( "overflow-y", "auto" );
        //     } else {
        //         $( this ).css( "overflow-y", "hidden" );
        //     }
        // };

        /**
         * Close balloon if the user click on some dead area
         * of the page.
         */
        $(document).on('click', function(e) {
            if ($(e.target).closest('section') == null) {
                closeBalloon();
            }
        });

        $( document ).ready( function () {
            initConstants();
            // XXX: there'a binding on 'section' are delegated to #outer in ui.events.js.
            //      Since our DOM elements are children of `section` we must attach to #outer
            //      to in order to prevent bubbling.
            //
            //      If a click event reaches #outer, we assume the user clicked outside
            //      the section, so we close the balloon.
            //
            //
            var delegate = '#outer';

            // Click on the link to open the balloon, in any segment on the page.
            // $( delegate ).on( 'click', '.segment-side-buttons .mbc-comment-icon-button', function ( e ) {
            //     e.stopPropagation();
            //     $( '.mbc-history-balloon-outer' ).removeClass( 'mbc-visible' );
            //     var $section = $( e.target ).closest( 'section' );
            //     UI.scrollSegment($section, UI.getSegmentId($section));
            // } );

            // TODO: investigate and explain why this is needed
            $( delegate ).on( 'click', '.mbc-comment-balloon-outer', function ( e ) {
                if ( $(".mbc-history-balloon-outer.mbc-visible").length ) {
                    e.stopPropagation();
                }
                $( '.mbc-history-balloon-outer' ).removeClass( 'mbc-visible' );
            } );

            // Click reached #outer , close the history balloon
            $( delegate ).on( 'click', function () {
                $( '.mbc-history-balloon-outer' ).removeClass( 'mbc-visible' );
            } );

            $( delegate ).on( 'click', '.segment-side-buttons .mbc-comment-icon-button', function ( e ) {
                var section = $( e.target ).closest( 'section' );
                $('.mbc-comment-icon-button').css("visibility", "");
                $( '.mbc-history-balloon-outer' ).removeClass( 'mbc-visible' );
                if ( section.find('.mbc-comment-balloon-outer').length ) {
                    closeBalloon();
                } else {
                    openSegmentComment(section);
                }
            } );

            $( delegate ).on( 'click', '.mbc-comment-balloon-inner .re-close-balloon', function ( e ) {
                closeBalloon();
            } );

            $( delegate ).on( 'click', '.mbc-comment-send-btn', function ( e ) {
                e.preventDefault();
                submitComment( $( e.target ).closest( 'section' ) );
            } );

            $( delegate ).on( 'click', '.mbc-comment-resolve-btn', function ( e ) {
                e.preventDefault();
                clearGenericWarning();

                var segment = new UI.Segment( $( e.target ).closest( 'section' ) );

                var data = {
                    action: 'comment',
                    _sub: 'resolve',
                    id_job: config.id_job,
                    id_client: config.id_client,
                    id_segment: segment.absoluteId,
                    password: config.password,
                    source_page: getSourcePage(),
                    username: getUsername(),
                };

                APP.doRequest( {
                    data: data,
                    success: ajaxResolveSuccess,
                    error: function () {
                        showGenericWarning();
                    }
                } );
            } );

            $( delegate ).on( 'click', '.show-thread-btn', function ( e ) {
                e.preventDefault();
                var el = $( e.target ).closest( 'a' );
                var panel = el.siblings( '.thread-collapsed' );
                var showlabel = $( el ).find( '.show-thread-label' );
                var showIconlabel = $( el ).find( '.show-toggle-icon' );

                if ( panel.is( ':visible' ) ) {
                    $( showlabel ).text( 'Show more' );
                    $( showIconlabel ).text( '+' );
                } else {
                    $( showlabel ).text( 'Show less' );
                    $( showIconlabel ).text( '-' );
                }

                panel.stop().slideToggle();
            } );

            $( delegate ).on( 'click', '.mbc-login-link', function ( e ) {
                $('#modal').trigger('openlogin');
            } );

            $( delegate ).on( 'click', '.mbc-comment-anonymous-label', function () {
                var elem = $( this );
                var replaceWith = $( '<input name="customName" type="text" class="mbc-comment-input mbc-comment-textinput" />' )
                        .val( getUsername() );
                var action = function () {
                    var tmpval = $.trim( htmlDecode( $( this ).val() ) );
                    if ( tmpval == "" ) {
                        customUserName = null;
                    } else {
                        customUserName = tmpval;
                        elem.text( customUserName );
                    }
                    $( this ).remove();
                    elem.text( getUsername() ).show();
                };

                elem.hide().after( replaceWith );

                replaceWith.blur( action ).keypress( function ( ev ) {
                    if ( ev.which == 13 ) {
                        action.call( ev.target );
                    }
                } ).focus();
            } );

            $( delegate ).on( 'click', '.mbc-new-message-link', function ( e ) {
                e.preventDefault();
                var root = $( e.target ).closest( '.mbc-comment-balloon-outer' );
                var scrollableArea = new Scrollable( root.find( '.mbc-comments-wrap' )[0] );
                scrollableArea.scrollToBottom();
            } );
        } );


        $( document ).on( 'keydown', function ( e ) {
            if ( e.which == '27' ) {
                e.preventDefault();
                $( '.mbc-history-balloon-outer.mbc-visible' ).toggleClass( 'mbc-visible' );
                closeBalloon();
            }
        } );

        $( document ).on( 'click', '.mbc-show-comment-btn', function ( e ) {
            e.preventDefault();
            $( '.mbc-history-balloon-outer' ).removeClass( 'mbc-visible' );

            var sid = $( e.target ).closest( 'div' ).data( 'id' );

            var new_hash = new ParsedHash( {
                segmentId: sid,
                action: MBC.const.commentAction
            } ).toString();

            window.location.hash = new_hash;
            UI.scrollSegment(UI.getSegmentById(segmentId), segmentId);

        } );

        $( window ).on( 'segmentsAdded', function ( e ) {
            loadCommentData( function ( resp ) {
                resetDatabase( resp );
                refreshElements();
            } );
        } );

        $( document ).on( 'getSegments_success', function ( e ) {
            loadCommentData( function ( resp ) {
                resetDatabase( resp );
                $( document ).trigger( 'mbc:ready' );
            } );
        } );

        $( document ).on( 'mbc:ready', function ( ev ) {

            $( '#mbc-history' ).remove();
            $( '.mbc-history-balloon-outer' ).remove();
            $( '.header-menu li#filterSwitch' ).before( $( tpls.historyIcon ) );
            $( '#mbc-history' ).append( $( tpls.historyOuter ).append( $( tpls.historyNoComments ) ) );


            getTeamUsers().then(refreshElements);
            //New icon inserted in the header -> resize file name
            APP.fitText($('.breadcrumbs'), $('#pname'), 30);

            // open a comment if was asked by hash
            var lastAsked = popLastCommentHash();
            if ( lastAsked ) {
                openSegmentComment( UI.Segment.findEl( lastAsked.segmentId ) );
            }
        } );

        $( document ).on( 'sse:ack', function ( ev, message ) {
            config.id_client = message.data.clientId;
        } );

        $( document ).on( 'sse:comment', function ( ev, message ) {
            db.pushSegment( message.data );
            $( document ).trigger( 'mbc:comment:new', message.data );
        } );

        $( document ).on( 'click', '#filterSwitch', function ( e ) {
            $( '.mbc-history-balloon-outer' ).removeClass( 'mbc-visible' );
        } );

        $( document ).on( 'click', '#mbc-history', function ( ev ) {
            if ( $( '.mbc-history-balloon-outer' ).hasClass('mbc-visible') ) {
                UI.closeAllMenus(ev);
            } else {
                UI.closeAllMenus(ev);
                $( '.mbc-history-balloon-outer' ).addClass( 'mbc-visible' );
            }
        } );

        $( document ).on( 'mbc:comment:new', function ( ev, data ) {
            updateHistoryWithLoadedSegments();
            $( document ).trigger( 'mbc:segment:update:links', data.id_segment );

            var section = UI.Segment.findEl( data.id_segment );

            if ( section.find( '.mbc-thread-wrap' ).is( ':visible' ) ) {
                appendReceivedMessage( section );
            }
        } );

        $( document ).on( 'mbc:comment:saved', function ( ev, data ) {
            $( document ).find( 'section .mbc-thread-wrap' ).remove();

            db.pushSegment( data ); // TODO: move this in ajax success?
            updateHistoryWithLoadedSegments();

            $( document ).trigger( 'mbc:segment:update:links', data.id_segment );
            appendSubmittedMessage( UI.Segment.findEl( data.id_segment ) );
        } );

        // $( window ).on( 'segmentClosed', function ( e ) {
        //
        //     // closeBalloon(true);
        // } );

        $( window ).on( 'segmentOpened', function ( e ) {
            var segment = e.segment ;
            if ( MBC.wasAskedByCommentHash( segment.absoluteId ) ) {
                openSegmentComment( $( e.segment ) );
            }
            checkOpenSegmentComment(segment.absoluteId);
        } );

        $( document ).on( 'mbc:segment:update:links', function ( ev, id_segment ) {
            var comments_obj = db.getCommentsCountBySegment( id_segment );
            var el = UI.Segment.findEl( id_segment );
            resolveCommentLinkIcon( el.find( '.segment-side-buttons' ), comments_obj );
            checkOpenSegmentComment(id_segment);
        } );

        $( document ).on( 'split:segment:complete', function ( e, sid ) {
            var segment = UI.Segment.find( sid );
            initCommentLink( segment.el );
            renderCommentIconLink( segment.el );
        } );

        $( document ).on( 'click', '.mbc-comment-input', function ( e ) {
            $( e.target ).parent( 'div' ).find( '.mbc-comment-btn' ).addClass( 'mbc-visible' );
        } );

        $( document ).on( 'click', function ( e ) {
            $( '.mbc-comment-balloon-outer' ).find( '.mbc-comment-send-btn' ).addClass( 'mbc-hide' );
        } );

        $( document ).on( 'click', '.mbc-tag-link', function ( e ) {
            $( '.mbc-comment-textarea-tagging' ).toggleClass('hide');
        } );

        $( document ).on( 'ui:segment:focus', function ( e, sid ) {
            if ( lastCommentHash && lastCommentHash.segmentId == sid ) {
                openSegmentComment( UI.Segment.findEl( sid ) );
                lastCommentHash = null;
            }
        } );

        // Interfaces
        $.extend( MBC, {
            openSegmentComment: openSegmentComment,
            popLastCommentHash: popLastCommentHash,

            wasAskedByCommentHash: function ( sid ) {
                return lastCommentHash && lastCommentHash.segmentId == sid;
            },
            setLastCommentHash: function ( value ) {
                lastCommentHash = value;
            }
        } );

        // Interfaces
        $.extend( UI, {
            scrollSegment: scrollSegment,
            popLastCommentHash: popLastCommentHash,

            wasAskedByCommentHash: function ( sid ) {
                return lastCommentHash && lastCommentHash.segmentId == sid;
            },
            setLastCommentHash: function ( value ) {
                lastCommentHash = value;
            }
        } );

    })( jQuery, config, window, MBC );
