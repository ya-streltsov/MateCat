/**
 * React Component for the editarea.

 */
var React = require('react');
let PropTypes = require('prop-types');
var SegmentStore = require('../../stores/SegmentStore');
var Segment = require('./Segment').default;
var SegmentConstants = require('../../constants/SegmentConstants');

class SegmentsContainer extends React.Component {

    constructor(props) {
        super(props);
        console.time("Time: SegmentsContainer Mount/Update" + this.props.fid);
        this.state = {
            segments: [],
            splitGroup: [],
            timeToEdit: config.time_to_edit_enabled
        };

        this.segmentsRefs = {};
        this.containerRef;
        this.segmentsRefsArray = [];
        this.renderSegments = this.renderSegments.bind(this);
        this.updateAllSegments = this.updateAllSegments.bind(this);
        this.splitSegments = this.splitSegments.bind(this);
        this.scrollToSegment = this.scrollToSegment.bind(this);
    }

    splitSegments(segments, splitGroup, fid) {
        if (fid == this.props.fid) {
            this.setState({
                segments: segments,
                splitGroup: splitGroup
            });
        }
    }

    updateAllSegments() {
        this.forceUpdate();
    }

    renderSegments(segments, fid) {
        if (parseInt(fid) !== parseInt(this.props.fid)) return;
        let splitGroup = [];
        this.setState({
            segments: segments,
            splitGroup: splitGroup,
            timeToEdit: config.time_to_edit_enabled,
        });

    }

    setLastSelectedSegment(sid, fid) {
        this.lastSelectedSegment = {
            sid: sid,
            fid: fid
        };
    }

    setBulkSelection(sid, fid) {
        if (_.isUndefined(this.lastSelectedSegment) ||
            fid !== this.lastSelectedSegment.fid) {
            this.lastSelectedSegment = {
                sid: sid,
                fid: fid
            };
        }
        let from = Math.min(sid, this.lastSelectedSegment.sid);
        let to = Math.max(sid, this.lastSelectedSegment.sid);
        this.lastSelectedSegment = {
            sid: sid,
            fid: fid
        };
        SegmentActions.setBulkSelectionInterval(from, to, fid);
    }

    scrollToSegment(sid, fid) {
        if (fid === this.props.fid) {
            const to = ReactDOM.findDOMNode(this.segmentsRefs[parseInt(sid)]);
            const element = document.getElementById('outer');
            const container = document.getElementById('file-'+this.props.fid);

            const index = this.segmentsRefsArray.indexOf(sid);
            let offsetScroll = 140;
            if (this.segmentsRefsArray.indexOf(sid) > 0) {
                const ref = ReactDOM.findDOMNode(this.segmentsRefs[this.segmentsRefsArray[index - 1]]);
                const prevHeight = ref.clientHeight;
                prevHeight > offsetScroll ? offsetScroll = prevHeight + 10 : null;
            }
            element.scroll({top: to.offsetTop - offsetScroll + container.offsetTop, left: 0, behavior: 'smooth'})
        }
    }

    componentDidMount() {
        SegmentStore.addListener(SegmentConstants.RENDER_SEGMENTS, this.renderSegments);
        SegmentStore.addListener(SegmentConstants.SPLIT_SEGMENT, this.splitSegments);
        SegmentStore.addListener(SegmentConstants.UPDATE_ALL_SEGMENTS, this.updateAllSegments);
        SegmentStore.addListener(SegmentConstants.SCROLL_TO_SEGMENT, this.scrollToSegment);
        // console.timeEnd("Time: SegmentsContainer Mount/Update"+this.props.fid);
    }

    componentWillUnmount() {
        SegmentStore.removeListener(SegmentConstants.RENDER_SEGMENTS, this.renderSegments);
        SegmentStore.removeListener(SegmentConstants.SPLIT_SEGMENT, this.splitSegments);
        SegmentStore.removeListener(SegmentConstants.UPDATE_ALL_SEGMENTS, this.updateAllSegments);
        SegmentStore.removeListener(SegmentConstants.SCROLL_TO_SEGMENT, this.scrollToSegment);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (!nextState.segments.equals(this.state.segments) ||
            nextState.splitGroup !== this.state.splitGroup ||
            nextState.tagLockEnabled !== this.state.tagLockEnabled)
    }

    componentWillUpdate() {
        saveSelection();
    }

    componentDidUpdate() {
        restoreSelection();
        // console.timeEnd("Time: SegmentsContainer Mount/Update"+this.props.fid);
    }

    render() {
        let items = [];
        let isReviewImproved = !!(this.props.isReviewImproved);
        this.state.segments.forEach((segImmutable) => {
            let segment = segImmutable.toJS();
            const item = <Segment
                key={segment.sid}
                segment={segment}
                timeToEdit={this.state.timeToEdit}
                fid={this.props.fid}
                isReviewImproved={isReviewImproved}
                isReview={this.props.isReview}
                enableTagProjection={this.props.enableTagProjection}
                decodeTextFn={this.props.decodeTextFn}
                tagLockEnabled={this.state.tagLockEnabled}
                tagModesEnabled={this.props.tagModesEnabled}
                speech2textEnabledFn={this.props.speech2textEnabledFn}
                reviewType={this.props.reviewType}
                setLastSelectedSegment={this.setLastSelectedSegment.bind(this)}
                setBulkSelection={this.setBulkSelection.bind(this)}
                ref={(el) => {
                    this.segmentsRefs[segment.sid] = el;
                    this.segmentsRefsArray.push(segment.sid);
                }}
            />;
            items.push(item);
        });
        return <div ref={(el) => {
            this.containerRef = el
        }} style={{display:'inline-block'}}>{items}</div>;
    }
}

SegmentsContainer.propTypes = {
    segments: PropTypes.array,
    splitGroup: PropTypes.array,
    timeToEdit: PropTypes.string
};

SegmentsContainer.defaultProps = {
    segments: [],
    splitGroup: [],
    timeToEdit: ""
};

export default SegmentsContainer;

