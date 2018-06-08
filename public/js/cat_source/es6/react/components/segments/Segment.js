let React = require('react');
let SegmentStore = require('../../stores/SegmentStore');
let SegmentActions = require('../../actions/SegmentActions');
let SegmentConstants = require('../../constants/SegmentConstants');
let SegmentHeader = require('./SegmentHeader').default;
let SegmentFooter = require('./SegmentFooter').default;
let SegmentBody = require('./SegmentBody').default;
let TranslationIssuesSideButtons = require('../review/TranslationIssuesSideButton').default;
let IssuesContainer = require('./footer-tab-issues/SegmentFooterTabIssues').default;
let Immutable = require('immutable');

class Segment extends React.Component {

    constructor(props) {
        super(props);

        this.reviewExtendedFooter = 'extended-footer';

        this.createSegmentClasses = this.createSegmentClasses.bind(this);
        /*this.hightlightEditarea = this.hightlightEditarea.bind(this);*/
        this.addClass = this.addClass.bind(this);
        this.removeClass = this.removeClass.bind(this);
        this.setAsAutopropagated = this.setAsAutopropagated.bind(this);
        this.addTranslationsIssues = this.addTranslationsIssues.bind(this);
        this.handleChangeBulk = this.handleChangeBulk.bind(this);
        this.openSegment = this.openSegment.bind(this);
        this.openSegmentFromAction = this.openSegmentFromAction.bind(this);
        this.checkIfCanOpenSegment = this.checkIfCanOpenSegment.bind(this);

        let readonly = UI.isReadonlySegment(this.props.segment);

        this.state = {
            segment_classes: [],
            modified: false,
            autopropagated: this.props.segment.autopropagated_from != 0,
            showTranslationIssues: false,
            unlocked: UI.isUnlockedSegment(this.props.segment),
            readonly: readonly,
            inBulk: false,
            tagProjectionEnabled: this.props.enableTagProjection && (this.props.segment.status.toLowerCase() === 'draft' || this.props.segment.status.toLowerCase() === 'new')
            && !UI.checkXliffTagsInText(this.props.segment.translation)
        }
    }

    openSegment() {
        if (!this.checkIfCanOpenSegment()) {
            if (UI.projectStats && UI.projectStats.TRANSLATED_PERC_FORMATTED === 0) {
                alertNoTranslatedSegments();
            } else {
                alertNotTranslatedYet(this.props.segment.sid);
            }
        } else {

            // TODO Remove this block
            /**************************/

            //From EditAreaClick
            UI.closeTagAutocompletePanel();
            UI.removeHighlightCorrespondingTags();
            if (UI.warningStopped) {
                UI.warningStopped = false;
                UI.checkWarnings(false);
            }
            // start old cache
            UI.currentSegmentId = this.props.segment.sid;
            UI.currentSegment = $(this.section);
            let sourceTags = this.props.segment.segment
                .match(/(&lt;\s*\/*\s*(g|x|bx|ex|bpt|ept|ph|it|mrk)\s*.*?&gt;)/gi);
            UI.sourceTags = sourceTags || [];
            UI.currentSegmentTranslation = $(this.section).find(UI.targetContainerSelector()).text();
            UI.currentFile = $(this.section).closest("article");
            UI.currentFileId = this.props.segment.fid;

            //end old cache

            UI.evalNextSegment($(this.section), 'untranslated');
            UI.updateJobMenu();
            UI.clearUndoStack();
            $(document).trigger('segment:activate', {segment: new UI.Segment($(this.section))});  //Used by Segment Filter
            UI.getNextSegment(UI.currentSegment, 'untranslated');
            UI.setEditingSegment($(this.section));  //TODO Remove: set Class editing to the body and trigger event used by review improved
            $('html').trigger('open'); // used by ui.review to open tab Revise in the footernext-unapproved
            $(window).trigger({
                type: "segmentOpened",
                segment: new UI.Segment($(this.section))
            });

            Speech2Text.enabled() && Speech2Text.enableMicrophone($(this.section));
            /************/
            UI.editStart = new Date();
            SegmentActions.setOpenSegment(this.props.segment.sid, this.props.fid);
            SegmentActions.getContributions(this.props.segment.sid, this.props.fid, this.props.segment.segment);
            SegmentActions.getGlossaryForSegment(this.props.segment.sid, this.props.fid, this.props.segment.segment);

            //From EditAreaClick
            UI.checkTagProximity();

            setTimeout(() => {
                window.location.hash = this.props.segment.sid
            }, 300);

        }
    }

    openSegmentFromAction(sid) {
        let self = this;
        sid = sid + "";
        if (sid === this.props.segment.sid) {
            setTimeout(function () {
                self.openSegment();
            });
        }
    }

    createSegmentClasses() {
        let classes = [];
        let splitGroup = this.props.segment.split_group || [];
        let readonly = this.state.readonly;
        if (readonly) {
            classes.push('readonly');
        }

        if (this.props.segment.ice_locked === "1" && !readonly) {
            if (this.props.segment.unlocked) {
                classes.push('ice-unlocked');
            } else {
                classes.push('readonly');
                classes.push('ice-locked');
            }
        }

        if (this.props.segment.status) {
            classes.push('status-' + this.props.segment.status.toLowerCase());
        }
        else {
            classes.push('status-new');
        }

        if (this.props.segment.sid == splitGroup[0]) {
            classes.push('splitStart');
        }
        else if (this.props.segment.sid == splitGroup[splitGroup.length - 1]) {
            classes.push('splitEnd');
        }
        else if (splitGroup.length) {
            classes.push('splitInner');
        }
        if (this.state.tagProjectionEnabled && !this.props.segment.tagged) {
            classes.push('enableTP');
            this.dataAttrTagged = "nottagged";
        } else {
            this.dataAttrTagged = "tagged";
        }
        if (this.props.isReviewImproved) {
            classes.push("reviewImproved");
        }
        if (this.props.segment.inBulk) {
            classes.push("segment-selected-inBulk");
        }
        if (this.props.segment.muted) {
            classes.push('muted');
        }
        if (this.props.segment.opened) {
            classes.push('editor');
            classes.push('opened');
        }
        if (this.props.segment.modified) {
            classes.push('modified');
        }

        return classes;
    }
    //TODO: ###REMOVE###
    /*hightlightEditarea(sid) {

        if (this.props.segment.sid == sid) {
            /!*  TODO REMOVE THIS CODE
             *  The segment must know about his classes
             *!/
            let classes = $('#segment-' + this.props.segment.sid).attr("class").split(" ");
            if (!!classes.indexOf("modified")) {
                classes.push("modified");
                this.setState({
                    segment_classes: classes
                });
            }
        }
    }*/

    addClass(sid, newClass) {
        if ( this.props.segment.sid == sid || sid === -1 || sid.split("-")[0] == this.props.segment.sid ) {
            let self = this;
            let classes = this.state.segment_classes.slice();
            if (newClass.indexOf(' ') > 0) {
                let self = this;
                let classesSplit = newClass.split(' ');
                _.forEach(classesSplit, function (item) {
                    if (classes.indexOf(item) < 0) {
                        classes.push(item);
                    }
                })
            } else {
                if (classes.indexOf(newClass) < 0) {
                    classes.push(newClass);
                }
            }
            this.setState({
                segment_classes: classes
            });
        }
    }

    removeClass(sid, className) {
        if (this.props.segment.sid == sid || sid === -1 || sid.indexOf(this.props.segment.sid) !== -1) {
            let classes = this.state.segment_classes.slice();
            let removeFn = function (item) {
                let index = classes.indexOf(item);
                if (index > -1) {
                    classes.splice(index, 1);

                }
            };
            if (className.indexOf(' ') > 0) {
                let self = this;
                let classesSplit = className.split(' ');
                _.forEach(classesSplit, function (item) {
                    removeFn(item);
                })
            } else {
                removeFn(className);
            }
            this.setState({
                segment_classes: classes
            });
        }
    }

    setAsAutopropagated(sid, propagation) {
        if (this.props.segment.sid == sid) {
            this.setState({
                autopropagated: propagation,
            });
        }
    }


    isSplitted() {
        return (!_.isUndefined(this.props.segment.split_group));
    }

    isFirstOfSplit() {
        return (!_.isUndefined(this.props.split_group) &&
            this.props.segment.split_group.indexOf(this.props.segment.sid) === 0);
    }

    addTranslationsIssues() {
        this.setState({
            showTranslationIssues: true,
        });
    }

    getTranslationIssues() {
        if (this.state.showTranslationIssues &&
            (!(this.props.segment.readonly === 'true') && !this.isSplitted())) {
            return <TranslationIssuesSideButtons
                sid={this.props.segment.sid.split('-')[0]}
                reviewType={this.props.reviewType}
                segment={this.props.segment}
            />;
        }
        return null;
    }

    lockUnlockSegment(event) {
        event.preventDefault();
        event.stopPropagation();
        SegmentActions.setSegmentLocked(this.props.segment, this.props.fid, !this.props.segment.unlocked);
    }

    handleChangeBulk(event) {
        if (event.shiftKey) {
            this.props.setBulkSelection(this.props.segment.sid, this.props.fid);
        } else {
            SegmentActions.toggleSegmentOnBulk(this.props.segment.sid, this.props.fid);
            this.props.setLastSelectedSegment(this.props.segment.sid, this.props.fid);
        }
    }


    allowHTML(string) {
        return {__html: string};
    }

    componentDidMount() {
        //TODO: ###REMOVE###
        //SegmentStore.addListener(SegmentConstants.HIGHLIGHT_EDITAREA, this.hightlightEditarea);
        //SegmentStore.addListener(SegmentConstants.ADD_SEGMENT_CLASS, this.addClass);
        //SegmentStore.addListener(SegmentConstants.REMOVE_SEGMENT_CLASS, this.removeClass);
        SegmentStore.addListener(SegmentConstants.SET_SEGMENT_PROPAGATION, this.setAsAutopropagated);
        SegmentStore.addListener(SegmentConstants.MOUNT_TRANSLATIONS_ISSUES, this.addTranslationsIssues);
        SegmentStore.addListener(SegmentConstants.OPEN_SEGMENT, this.openSegmentFromAction);
    }


    componentWillUnmount() {
        //TODO: ###REMOVE###
        //SegmentStore.removeListener(SegmentConstants.HIGHLIGHT_EDITAREA, this.hightlightEditarea);
        //SegmentStore.removeListener(SegmentConstants.ADD_SEGMENT_CLASS, this.addClass);
        //SegmentStore.removeListener(SegmentConstants.REMOVE_SEGMENT_CLASS, this.removeClass);
        SegmentStore.removeListener(SegmentConstants.SET_SEGMENT_PROPAGATION, this.setAsAutopropagated);
        SegmentStore.removeListener(SegmentConstants.MOUNT_TRANSLATIONS_ISSUES, this.addTranslationsIssues);
        SegmentStore.removeListener(SegmentConstants.OPEN_SEGMENT, this.openSegmentFromAction);
    }

    componentWillReceiveProps(nextProps) {
        if (!this.props.segment.opened && nextProps.segment.opened) {
            //UI.scrollSegment($(this.section), this.props.segment.sid);
            setTimeout(()=>{SegmentActions.scrollToSegment(this.props.segment.sid,this.props.segment.fid)},0)

        }

        //check if this segment is in closing
        if (this.props.segment.opened && !nextProps.segment.opened) {
            //check if this segment require setTranslation
            if (!this.props.isReview && this.props.segment.modified) {
                UI.setTranslation({
                    id_segment: UI.getSegmentId($(this.section)),
                    status: this.props.segment.status ,
                    caller: 'autosave'
                });
            }
        }
    }

    checkIfCanOpenSegment() {
        return (this.props.isReview && !(this.props.segment.status == 'NEW') && !(this.props.segment.status == 'DRAFT'))
            || !this.props.isReview;
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            (!Immutable.fromJS(nextProps.segment).equals(Immutable.fromJS(this.props.segment))) ||
            (!Immutable.fromJS(nextState.segment_classes).equals(Immutable.fromJS(this.state.segment_classes))) ||
            (nextState.modified !== this.state.modified) ||
            (nextState.autopropagated !== this.state.autopropagated) ||
            (nextState.showTranslationIssues !== this.state.showTranslationIssues) ||
            (nextState.readonly !== this.state.readonly)
        );
    }

    onClickEvent(event) {
        if (this.state.readonly || (!this.props.segment.unlocked && this.props.segment.ice_locked === '1')) {
            UI.handleClickOnReadOnly( $(event.currentTarget).closest('section') );
        } else if (this.props.segment.muted) {
            return;
        } else {
            this.openSegment();
            UI.removeSelectedClassToTags()
        }
    }

    render() {
        console.log('Render segment: ',this.props.segment.sid,this.props.segment.opened);
        let job_marker = "",
            timeToEdit = "",
            readonly = this.state.readonly,
            segment_classes = this.state.segment_classes.concat(this.createSegmentClasses()),
            split_group = this.props.segment.split_group || [],
            autoPropagable = (this.props.segment.repetitions_in_chunk != "1"),
            originalId = this.props.segment.sid.split('-')[0],
            start_job_marker = this.props.segment.sid == config.first_job_segment,
            end_job_marker = this.props.segment.sid == config.last_job_segment;

        if (this.props.timeToEdit) {
            this.segment_edit_min = this.props.segment.parsed_time_to_edit[1];
            this.segment_edit_sec = this.props.segment.parsed_time_to_edit[2];
        }

        if (start_job_marker) {
            job_marker = <span className={"start-job-marker"}/>;
        } else if (end_job_marker) {
            job_marker = <span className={"end-job-marker"}/>;
        }

        if (this.props.timeToEdit) {
            timeToEdit = <span className="edit-min">{this.segment_edit_min}</span> + 'm' +
                <span className="edit-sec">{this.segment_edit_sec}</span> + 's';
        }

        let translationIssues = this.getTranslationIssues();
        return (
            <section
                ref={(section) => this.section = section}
                id={"segment-" + this.props.segment.sid}
                className={segment_classes.join(' ')}
                data-hash={this.props.segment.segment_hash}
                data-autopropagated={this.state.autopropagated}
                data-propagable={autoPropagable}
                data-version={this.props.segment.version}
                data-split-group={split_group}
                data-split-original-id={originalId}
                data-tagmode="crunched"
                data-tagprojection={this.dataAttrTagged}
                onClick={this.onClickEvent.bind(this)}
                data-fid={this.props.fid}>
                <div className="sid" title={this.props.segment.sid}>
                    <div className="txt">{this.props.segment.sid}</div>

                    {this.props.segment.ice_locked === '1' ? (
                        !readonly ? (
                            this.props.segment.unlocked ? (
                                <div className="ice-locked-icon"
                                     onClick={this.lockUnlockSegment.bind(this)}>
                                    <button className="unlock-button unlocked icon-unlocked3"/>
                                </div>
                            ) : (
                                <div className="ice-locked-icon"
                                     onClick={this.lockUnlockSegment.bind(this)}>
                                    <button className="icon-lock unlock-button locked"/>
                                </div>
                            )
                        ) : (null)
                    ) : (null)}

                    {!config.isLQA ? (
                        <div className="txt segment-add-inBulk">
                            <input type="checkbox"
                                   ref={(node) => this.bulk = node}
                                   checked={this.props.segment.inBulk}
                                   onClick={this.handleChangeBulk}
                            />
                        </div>
                    ) : (null)}


                    {(this.props.segment.ice_locked !== '1' && config.splitSegmentEnabled) ? (
                        <div className="actions">
                            <button className="split" href="#" title="Click to split segment">
                                <i className="icon-split"/>
                            </button>
                            <p className="split-shortcut">CTRL + S</p>
                        </div>
                    ) : (null)}

                </div>
                {job_marker}

                <div className="body">
                    <SegmentHeader sid={this.props.segment.sid} autopropagated={this.state.autopropagated}/>
                    <SegmentBody
                        reviewType={this.props.reviewType}
                        segment={this.props.segment}
                        fid={this.props.fid}
                        readonly={this.state.readonly}
                        isReviewImproved={this.props.isReviewImproved}
                        isReview={this.props.isReview}
                        decodeTextFn={this.props.decodeTextFn}
                        tagModesEnabled={this.props.tagModesEnabled}
                        speech2textEnabledFn={this.props.speech2textEnabledFn}
                        enableTagProjection={this.props.enableTagProjection && !this.props.segment.tagged}
                        locked={!this.props.segment.unlocked && this.props.segment.ice_locked === '1'}
                        openSegment={this.openSegment}
                    />
                    <div className="timetoedit"
                         data-raw-time-to-edit={this.props.segment.time_to_edit}>
                        {timeToEdit}
                    </div>
                    {SegmentFilter && SegmentFilter.enabled() ? (
                        <div className="edit-distance">Edit Distance: {this.props.segment.edit_distance}</div>
                    ) : (null)}

                    {config.isReview && this.props.reviewType === this.reviewExtendedFooter ? (
                        <IssuesContainer
                            segment={this.props.segment}
                            sid={this.props.segment.sid}
                        />
                    ) : (null)}

                    {this.props.segment.opened ? (<SegmentFooter
                        segment={this.props.segment}
                        sid={this.props.segment.sid}
                        fid={this.props.fid}
                        decodeTextFn={this.props.decodeTextFn}
                    />) : (null)}
                </div>

                {/*//!-- TODO: place this element here only if it's not a split --*/}
                <div className="segment-side-buttons">
                    <div data-mount="translation-issues-button" className="translation-issues-button"
                         data-sid={this.props.segment.sid}>
                        {translationIssues}
                    </div>
                </div>
            </section>
        );
    }
}

export default Segment;

