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

    createEscapedSegment() {
        var text = this.props.segment.segment;
        if (!$.parseHTML(text).length) {
            text = text.replace(/<span(.*?)>/gi, '').replace(/<\/span>/gi, '');
        }

        var escapedSegment = htmlEncode(text.replace(/\"/g, "&quot;"));
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
            var area = $("#segment-" + this.props.segment.sid + " .source");
            this.props.afterRenderOrUpdate(area);
        }
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

    markGlossaryItemsInSource() {
        let matchesObj = this.props.segment.glossary;

        if ( ! Object.size( matchesObj ) ) return this.state.source;

        // root.QaCheckGlossary.enabled() && root.QaCheckGlossary.removeUnusedGlossaryMarks( container );

        let cleanString = this.state.source;

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

            var re = new RegExp( '\\b'+ glossaryTerm_escaped.trim() + '\\b', "gi" );

            cleanString = cleanString.replace( re, '<mark class="inGlossary">' + currentMatch + '</mark>' );


        } );
        // TODO remove
        $(document).trigger('glossarySourceMarked', { segment :  new UI.Segment( UI.currentSegment ) } );
        return cleanString;
    }

    componentDidMount() {
        SegmentStore.addListener(SegmentConstants.REPLACE_SOURCE, this.replaceSource);
        SegmentStore.addListener(SegmentConstants.DISABLE_TAG_LOCK, this.toggleTagLock);
        SegmentStore.addListener(SegmentConstants.ENABLE_TAG_LOCK, this.toggleTagLock);
        this.afterRenderActions();
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
            source = this.markGlossaryItemsInSource();
        }
        let escapedSegment = this.createEscapedSegment();
        return (
            <div className={"source item"}
                 tabIndex={0}
                 id={"segment-" + this.props.segment.sid +"-source"}
                 data-original={escapedSegment}
                 dangerouslySetInnerHTML={ this.allowHTML(source) }
                 onCopy={this.onCopyEvent.bind(this)}
                 onDragStart={this.onDragEvent.bind(this)}
            />
        )
    }
}

export default SegmentSource;
