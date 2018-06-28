QaCheckBlacklist = {} ;

QaCheckBlacklist.enabled = function() {
    return config.qa_check_blacklist_enabled ;
}

// COMMON EVENTS
if (QaCheckBlacklist.enabled() )
(function($, UI, undefined) {

    var qaCheckRegExp = '\\b(%s)\\b' ;
    // var cjkRegExp = '(%s)';
    var regExpFlags = 'g';

    // $( window ).on( 'segmentsAdded', function ( e ) {
    //     globalReceived = false ;
    //     renderGlobalWarnings() ;
    // });

    $(document).on('getWarning:global:success', function(e, data) {
        renderGlobalWarnings(data.resp.data.blacklist) ;
    });

    $(document).on('getWarning:local:success', function(e, data) {
        if ( !data.resp.data.blacklist  ) {
            return ;
        }

        var matched_words = Object.keys( data.resp.data.blacklist.matches )

        updateBlacklistItemsInSegment( UI.getSegmentId(data.segment.el), matched_words );
    });

    function addTip( editarea ) {
        $('.blacklistItem', editarea).powerTip({
            placement : 's'
        });
        $('.blacklistItem', editarea).data({ 'powertipjq' : $('<div class="blacklistTooltip">Blacklisted term</div>') });
    }
    /*
    * Can be called externaly (by LexiQA) to reload powerip
    * and add the click handler - which have been removed after the HTML was replaced
    */
    function reloadPowertip(editarea) {
        $('.blacklistItem', editarea).powerTip({
            placement : 's'
        });
        $('.blacklistItem', editarea).data({ 'powertipjq' : $('<div class="blacklistTooltip">Blacklisted term</div>') });
    }
    /*
    * Can be called externaly (by LexiQA) to destroy powtip and prevent
    * memory leak when HTML is replaced
    */
    function destroyPowertip(editarea) {
        $.powerTip.destroy($('.blacklistItem', editarea));
    }
    /**
     *
     * @param editarea
     * @param matched_words
     */
    function updateBlacklistItemsInSegment( segmentId, matched_words ) {
        // saveSelection() ;
        //
        // editarea.find('.blacklistItem').each(function(index)  {
        //     $(this).replaceWith( this.childNodes );
        // });
        //
        // if ( matched_words.length ) {
        //     editarea[0].normalize() ;
        //
        //     var newHTML = editarea.html() ;
        //     if (LXQ.enabled())
        //       newHTML = LXQ.cleanUpHighLighting(newHTML);
        //     $(matched_words).each(function(index, value) {
        //         value = escapeRegExp( value );
        //         var re = new RegExp('\\b(' + value + ')\\b',"g");
        //         newHTML = newHTML.replace(
        //             re , '<span class="blacklistItem">$1</span>'
        //         );
        //     });
        //     SegmentActions.replaceEditAreaTextContent(UI.getSegmentId(editarea), UI.getSegmentFileId(editarea), newHTML);
        // }
        //
        // restoreSelection();
        //
        // setTimeout(addTip( editarea ));

        var mapped = {}
        mapped[segmentId] = [];
        _.each(matched_words, function(item, key) {
            mapped[segmentId].push({match: key});
        });
        // SegmentActions.updateQaCheckBlacklistItems(mapped);
    }


    function renderGlobalWarnings(blacklist) {

        var mapped = {} ;

        // group by segment id
        _.each( blacklist.matches, function ( item ) {
            mapped[ item.id_segment ] ? null : mapped[ item.id_segment ] = []  ;
            mapped[ item.id_segment ].push( { severity: item.severity, match: item.data.match } );
        });

        SegmentActions.setQaCheckBlacklistItems(mapped);

        // _.each(Object.keys( mapped ) , function(item, index) {
        //     var segment = UI.Segment.find( item );
        //     if ( !segment || segment.isReadonly() ) return ;
        //
        //     var matched_words = _.chain( mapped[item]).map( function( match ) {
        //         return match.match ;
        //     }).uniq().value() ;
        //
        //     var editarea = segment.el.find(  UI.targetContainerSelector() ) ;
        //     updateBlacklistItemsInSegment( editarea, matched_words ) ;
        // });
        //
        // globalReceived = true ;
    }

    $.extend(QaCheckBlacklist, {
        qaCheckRegExpFlags: regExpFlags,
        qaCheckRegExp: qaCheckRegExp
    });

})(jQuery, UI );
