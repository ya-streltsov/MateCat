QaCheckGlossary = {};

QaCheckGlossary.enabled = function() {
    return config.qa_check_glossary_enabled ;
};

if ( QaCheckGlossary.enabled() )
(function($, QaCheckGlossary, undefined) {
    var qaCheckRegExp = '\\b(%s)\\b' ;
    // var cjkRegExp = '(%s)';
    var regExpFlags = 'g';

    $(document).on('getWarning:global:success', function(e, data) {
        updateGlobalWarnings(data.resp.data.glossary) ;
    });

    function updateGlobalWarnings(glossary) {

        var mapped = {} ;

        // group by segment id
        _.each( glossary.matches, function ( item ) {
            mapped[ item.id_segment ] ? null : mapped[ item.id_segment ] = []  ;
            mapped[ item.id_segment ].push( item.data );
        });

        SegmentActions.setQaCheckGlossaryItems(mapped);
    }
    /*
    * Can be called externaly (by LexiQA) to destroy powtip and prevent
    * memory leak when HTML is replaced
    */
    function destroyPowertip(container) {
        $.powerTip.destroy($('.blacklistItem', container));
    }

    $.extend(QaCheckGlossary, {
        qaCheckRegExpFlags: regExpFlags,
        qaCheckRegExp: qaCheckRegExp
    });

})(jQuery, QaCheckGlossary);
