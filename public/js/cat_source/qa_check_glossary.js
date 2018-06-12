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
    * Can be called externaly (by LexiQA) to reload powerip
    */
    function redoBindEvents(container) {
        $('.unusedGlossaryTerm', container).powerTip({
            placement : 's'
        });
        $('.unusedGlossaryTerm', container).data({ 'powertipjq' : $('<div class="unusedGlossaryTip" style="padding: 4px;">Unused glossary term</div>') });
    }
    /*
    * Can be called externaly (by LexiQA) to destroy powtip and prevent
    * memory leak when HTML is replaced
    */
    function destroyPowertip(container) {
        $.powerTip.destroy($('.blacklistItem', container));
    }

    function bindEvents( container, unusedMatches ) {

        container.find('.unusedGlossaryTerm').each(function(index, item) {
            var el = $(item);

            var entry = _.chain(unusedMatches).filter(function findMatch(match, index) {
                return match.id == el.data('id');
            }).first().value();

            el.powerTip({ placement : 's' });
            el.data({ 'powertipjq' : $('<div class="unusedGlossaryTip" style="padding: 4px;">Unused glossary term</div>') });
        });
    }

    $.extend(QaCheckGlossary, {
        qaCheckRegExpFlags: regExpFlags
    });

})(jQuery, QaCheckGlossary);
