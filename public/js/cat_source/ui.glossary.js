/*
 Component: ui.glossary
 */

if (true)
(function($, UI, _, root, undefined) {

    $.extend( UI, {

        copyGlossaryItemInEditarea: function ( translation ) {
            UI.saveInUndoStack('paste');
            var range = window.getSelection().getRangeAt( 0 );
            var clonedElem = $( '.editor .editarea').clone();
            var nodeInsert = clonedElem.find( '.focusOut' );
            if ( nodeInsert.length === 0) {
                clonedElem.append(translation);
            } else {
                nodeInsert = nodeInsert.first();
                nodeInsert.before( translation + '<span class="tempCopyGlossaryPlaceholder"></span>' ).remove();
            }
            SegmentActions.highlightEditarea(UI.currentSegment.find(".editarea").data("sid"));
            SegmentActions.replaceEditAreaTextContent(UI.getSegmentId(this.editarea), UI.getSegmentFileId(this.editarea), clonedElem.html());
            setTimeout(function (  ) {

                var tempCopyGlossPlaceholder = UI.editarea.find( '.tempCopyGlossaryPlaceholder' );
                var node = tempCopyGlossPlaceholder[0];
                setCursorAfterNode( range, node );
                tempCopyGlossPlaceholder.remove();
            });
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
            //TODO: Create an action to open a Tab
            $segment.closest('section').find('.tab-switcher-gl').click();
        }

    } );

})(jQuery, UI, _, window);
