/*
 Component: ui.glossary
 */

if (true)
(function($, UI, _, root, undefined) {

    $.extend( UI, {

        copyGlossaryItemInEditarea: function ( translation ) {
            $( '.editor .editarea .focusOut' ).before( translation + '<span class="tempCopyGlossaryPlaceholder"></span>' ).remove();
            var range = window.getSelection().getRangeAt( 0 );
            var tempCopyGlossPlaceholder = $( '.editor .editarea .tempCopyGlossaryPlaceholder' );
            var node = tempCopyGlossPlaceholder[0];
            setCursorAfterNode( range, node );
            tempCopyGlossPlaceholder.remove();
            SegmentActions.highlightEditarea(UI.currentSegment.find(".editarea").data("sid"));
        },

        storeGlossaryData: function (sid, matches) {
            var matches = _.chain(Object.keys(matches)).map(function (item) {
                return matches[item];
            }).flatten().value();

            // find current segment record
            let record = MateCat.db.segments.by('sid', sid);
            if (record) {
                record.glossary_matches = matches;
                MateCat.db.segments.update(record);
            }
        },
        openSegmentGlossaryTab: function ( $segment ) {
            $segment.find('.tab-switcher-gl').click();
        }

    } );

})(jQuery, UI, _, window);
