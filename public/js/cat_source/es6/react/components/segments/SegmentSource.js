/**
 * React Component .

 */
var React = require('react');
var SegmentStore = require('../../stores/SegmentStore');
var SegmentConstants = require('../../constants/SegmentConstants');


class SegmentSource extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            source : this.props.segment.decoded_source

        };
        this.originalSource = this.createEscapedSegment(this.props.segment.segment);
        this.createEscapedSegment = this.createEscapedSegment.bind(this);
        this.decodeTextSource = this.decodeTextSource.bind(this);
        this.replaceSource = this.replaceSource.bind(this);
        this.beforeRenderActions = this.beforeRenderActions.bind(this);
        this.afterRenderActions = this.afterRenderActions.bind(this);
        this.toggleTagLock = this.toggleTagLock.bind(this);

    }

    replaceSource(sid, source) {
        if (this.props.segment.sid == sid) {
            this.setState({
                source: source
            });
        }
    }

    toggleTagLock(sid, source) {
        this.setState({
            source: this.props.segment.decoded_source
        });
    }

    decodeTextSource(segment, source) {
        return this.props.decodeTextFn(segment, source);
    }

    createEscapedSegment(text) {
        if (!$.parseHTML(text).length) {
            text = text.replace(/<span(.*?)>/gi, '').replace(/<\/span>/gi, '');
        }

        let escapedSegment = htmlEncode(text.replace(/\"/g, "&quot;"));
        /* this is to show line feed in source too, because server side we replace \n with placeholders */
        escapedSegment = escapedSegment.replace( config.lfPlaceholderRegex, "\n" );
        escapedSegment = escapedSegment.replace( config.crPlaceholderRegex, "\r" );
        escapedSegment = escapedSegment.replace( config.crlfPlaceholderRegex, "\r\n" );
        return escapedSegment;
    }

    beforeRenderActions() {
        if (!this.props.isReviewImproved) {
            var area = $("#segment-" + this.props.segment.sid + " .source");
            this.props.beforeRenderOrUpdate(area);
        }
    }

    afterRenderActions() {
        if (!this.props.isReviewImproved) {
            let area = $("#segment-" + this.props.segment.sid + " .source");
            this.props.afterRenderOrUpdate(area);
        }
        this.addPowerTips()

    }

    addPowerTips() {
        $(this.sourceRef).find('.unusedGlossaryTerm').each(function(index, item) {
            let el = $(item);
            el.powerTip({ placement : 's' });
            el.data({ 'powertipjq' : $('<div class="unusedGlossaryTip" style="padding: 4px;">Unused glossary term</div>') });
        });
    }

    addEvents() {
        let self = this;
        $(this.sourceRef).on('click', '.inGlossary, .unusedGlossaryTerm', function ( e ) {
            e.stopPropagation();
            e.preventDefault();
            self.openGlossaryTab()
        });

    }

    onCopyEvent(e) {
        UI.handleSourceCopyEvent(e);
    }

    onDragEvent(e) {
        UI.handleDragEvent(e);
    }

    /**
     * This function returns an array of strings that are already contained in other strings.
     *
     * Example:
     *      input ['canestro', 'cane', 'gatto']
     *      returns [ 'cane' ]
     *
     * @param matches
     * @returns {Array}
     */
    findInclusiveMatches( matches ) {
        var inclusiveMatches = [] ;
        $.each( matches, function ( index ) {
            $.each( matches, function ( ind ) {
                if ( index != ind ) {
                    if ( _.startsWith( matches[index], this ) ) {
                        inclusiveMatches.push( this );
                    }
                }
            } );
        } );
        return inclusiveMatches ;
    }
    openGlossaryTab() {
        UI.openSegmentGlossaryTab($(this.sourceRef));
    }


    markGlossaryItemsInSource(source) {
        let self = this;
        let matchesObj = this.props.segment.glossary;

        if ( ! Object.size( matchesObj ) ) return this.state.source;

        let cleanString = source;

        let intervals = [];
        let matches = [];
        $.each( matchesObj, function ( index ) {
            if (this[0].raw_segment) {
                matches.push( this[0].raw_segment );
            } else if (this[0].segment) {
                matches.push( this[0].segment );
            }
        } );

        let matchesToRemove = this.findInclusiveMatches( matches ) ;
        matches = matches.sort(function(a, b){
            return b.length - a.length;
        });
        $.each( matches, function ( index, currentMatch ) {
            // currentMatch = UI.decodePlaceholdersToText( currentMatch, true );

            let glossaryTerm_escaped = currentMatch
                .replace( /<\//gi, '<\\/' )
                .replace( /\(/gi, '\\(' )
                .replace( /\)/gi, '\\)' );

            var re = new RegExp( '\\b('+ glossaryTerm_escaped.trim() + ')\\b', "gi" );

            cleanString = cleanString.replace( re, '<mark class="inGlossary">$1</mark>' );


        } );
        // TODO remove
        $(document).trigger('glossarySourceMarked', { segment :  new UI.Segment( UI.currentSegment ) } );
        return cleanString;
    }

    markGlossaryUnusedMatches(source) {
        let unusedMatches = this.props.segment.qaGlossary;
        let newHTML = source;
        unusedMatches = unusedMatches.sort(function(a, b){
            return b.raw_segment.length - a.raw_segment.length;
        });
        $.each(unusedMatches, function( index ) {
            let value = (this.raw_segment) ? this.raw_segment : this.translation ;
            value = escapeRegExp( value );
            value = value.replace(/ /g, '(?: *<\/*(?:mark)*(?:span *)*(?: (data-id="(.*?)" )*class="(unusedGlossaryTerm)*(inGlossary)*")*> *)* *');
            let re = new RegExp( sprintf( QaCheckGlossary.qaCheckRegExp, value ), QaCheckGlossary.qaCheckRegExpFlags);
            //Check if value match inside the span (Ex: ID, class, data, span)
            let check = re.test( '<span class="unusedGlossaryTerm">$1</span>' );
            if ( !check ){
                newHTML = newHTML.replace(
                    re , '<span data-id="' + index + '" class="unusedGlossaryTerm">$1</span>'
                );
            } else  {
                re = new RegExp( sprintf( "\\s\\b(%s)\\s\\b", value ), QaCheckGlossary.qaCheckRegExpFlags);
                newHTML = newHTML.replace(
                    re , ' <span data-id="' + index + '" class="unusedGlossaryTerm">$1</span> '
                );
            }
        });
        return newHTML;
    }

    componentDidMount() {
        SegmentStore.addListener(SegmentConstants.REPLACE_SOURCE, this.replaceSource);
        SegmentStore.addListener(SegmentConstants.DISABLE_TAG_LOCK, this.toggleTagLock);
        SegmentStore.addListener(SegmentConstants.ENABLE_TAG_LOCK, this.toggleTagLock);
        this.afterRenderActions();
        this.addEvents();
    }

    componentWillUnmount() {
        SegmentStore.removeListener(SegmentConstants.REPLACE_SOURCE, this.replaceSource);
        SegmentStore.removeListener(SegmentConstants.DISABLE_TAG_LOCK, this.toggleTagLock);
        SegmentStore.removeListener(SegmentConstants.ENABLE_TAG_LOCK, this.toggleTagLock);
    }
    componentWillMount() {
        this.beforeRenderActions();
    }
    componentWillUpdate() {
        this.beforeRenderActions();
    }

    componentDidUpdate() {
        this.afterRenderActions()
    }

    allowHTML(string) {
        return { __html: string };
    }

    render() {
        let source = this.state.source;
        if ( this.props.segment.opened && this.props.segment.glossary) {
            source = this.markGlossaryItemsInSource(source);
        }
        if (QaCheckGlossary.enabled() && this.props.segment.opened && this.props.segment.qaGlossary) {
            source = this.markGlossaryUnusedMatches(source);
        }
        //let escapedSegment = this.createEscapedSegment();
        return (
            <div ref={(container)=>this.sourceRef=container}
                 className={"source item"}
                 tabIndex={0}
                 id={"segment-" + this.props.segment.sid +"-source"}
                 data-original={this.originalSource}
                 dangerouslySetInnerHTML={ this.allowHTML(source) }
                 onCopy={this.onCopyEvent.bind(this)}
                 onDragStart={this.onDragEvent.bind(this)}
            />
        )
    }
}

export default SegmentSource;
