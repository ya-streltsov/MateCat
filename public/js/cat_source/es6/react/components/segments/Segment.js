/**
 * React Component for the editarea.

 */


/*
* [x] Portare la createButtons in react
* [ ] Riportare tutto ciò che chiama editAreaClick in React
*
* Cose da fare con lo stato open:
* [x] Controllare se l'elemento è clicckabile (ui.opensegments.js->15)
* [ ] Far comparire un messaggio di errore quando la editarea non è cliccabile (riprendere dal task precedente)
* [ ] Ricostruire la logica del checkWarnings, ora viene chiamata anche all'apertura del segment, capire il perchè e riscrivere il comportamento
* [ ] Messaggio di errore se sono in review e non c'è nemmeno un segmento tradotto
* [ ] Ricostruire comportamento di byButton, il significato di questa variabile è "se sto selezionando non devi aprirmi, se ho cliccato devi aprirmi"
* [ ] Tenere la compatibilità con cacheObjects (ui.core.js->68)
* [x] Scrollare al segmento aperto
* [ ] Portare jobMenu in React e tenerlo in ascolto sulla render dei segmenti
* [ ] Svuotare gli undoStack, capire come portarli dentro react, magari su singolo componente o a livello di container
* [x] Renderizzare il footer
* [ ] Creare i bottoni, bisogna portare la logica in react
* [ ] Memorizzare nuovo lastSegmentId (segment_filter.js->221)
* [ ] Aprire il tab review se mi trovo in review normale
* [ ] Mettere nello store il prossimo elemento non tradotto e altre info utili (mi aiuta Federico)
* [ ] Focus nell'editarea
* [ ] Far disegnare i Marker del glossario direttamente dal componente source, così da evitare l'UI, ora se usiamo UI dispatcha troppi eventi e muore. UI.markGlossaryItemsInSource
* [ ] Glossario, controllare all'apertura della ricerca che vengano tolti i mark e rimessi alla chiusura ( cacheGlossaryData ui.glossary.js->68)
* [x] Prendere le get contribution con il nuovo sistema cache fatto in react,Pensare ad una maniera per precaricare il
*     next ed il nextuntraslated glossary e contribution. (se non readonly)
* [ ] Se l'editarea non ha contenuto e ci sono contributions al 100% bisogna inserire la contribution dentro la
*     editarea e fare anche qualche altra cosa (vedi renderContributions
* [ ] Rendere l'editarea editabile (se non è readonly)
* [ ] Controllare la classe editing che viene aggiunta (per ora) all'apertura del segmento e viene tolta alla chiusura (sul body)
* [ ] Tenere traccia dell'editstart (è una new Date()) da quando inizio a modificare a quando invio la translation
* [ ] Aprire commenti (MBC.main.js->879)
* [ ] Se mi trovo in review, review extended o review extended footer, chiamare getSegmentVersionsIssuesHandler (magari riportarlo in react)
* [ ] Se attivo lo spitchToText va attivato il microfono e va chiamata Speech2Text.enableMicrophone(segment.el)
* [ ] 'ESC' deve chiudere tutti i segmenti
*
* Cose da fare con lo stato close:
* [ ] Togliere l'editarea editabile
* [ ] Rimuovere una serie di classi dal segmento `waiting_for_check_result opened editor split-action`
* [ ] Chiudire commento corrispondente (MBC.main.js->825)
* [ ] Se il segmento è stato modificato e e mi sto spostando senza salvare, devo salvare il segmento,
     a meno che non mi trovo in review (UI.saveSegment).
* [ ] Non renderizzare i bottoni
* [ ] Se non sto andando ad un segmento successivo, disabilitare la `disableContinuousRecognizing`
* [ ] Disabilitare il microfono sul segmento corrente (ui.core.js->578)
* [ ] Controllare che venga rimosso il mark del glossario dal source
* [ ] Investigare sulla classe `justDone` aggiunto dalla funzione checkIfFinished (ui.core.js->241)
* [ ] Chiudere lo split se aperto.
* */


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
        this.hightlightEditarea = this.hightlightEditarea.bind(this);
        this.addClass = this.addClass.bind(this);
        this.removeClass = this.removeClass.bind(this);
        this.setAsAutopropagated = this.setAsAutopropagated.bind(this);
        this.setSegmentStatus = this.setSegmentStatus.bind(this);
        this.addTranslationsIssues = this.addTranslationsIssues.bind(this);
        this.handleChangeBulk = this.handleChangeBulk.bind(this);
        this.openSegment = this.openSegment.bind(this);
        this.checkIfCanOpenSegment = this.checkIfCanOpenSegment.bind(this);

        let readonly = UI.isReadonlySegment(this.props.segment);

        this.state = {
            segment_classes: [],
            modified: false,
            autopropagated: this.props.segment.autopropagated_from != 0,
            status: this.props.segment.status,
            showTranslationIssues: false,
            unlocked: UI.isUnlockedSegment(this.props.segment),
            readonly: readonly,
            inBulk: false,
            tagProjectionEnabled: this.props.enableTagProjection && (this.props.segment.status.toLowerCase() === 'draft' || this.props.segment.status.toLowerCase() === 'new')
            && !UI.checkXliffTagsInText(this.props.segment.translation)
        }
    }

    openSegment() {
        //controllare se sono nella review e se il segmento è tradotto altrimenti messaggio di errore poichè non posso aprire un segmento non tradotto nella review
        /*
           * Todo: remove UI.currentSegment and UI.currentSegmentId from openSegment()
           * */
        UI.currentSegment = $(this.section);
        UI.currentSegmentId = this.props.segment.sid;

        // TODO Remove

        UI.cacheObjects( $(this.section) );
        UI.evalNextSegment($(this.section), 'untranslated');
        $(window).trigger({
            type: "segmentOpened",
            segment: new UI.Segment( $(this.section) )
        });
        /************/

        SegmentActions.setOpenSegment(this.props.segment.sid, this.props.fid);
        SegmentActions.getContributions(this.props.segment.sid, this.props.fid, this.props.segment.segment);
        SegmentActions.getGlossaryForSegment(this.props.segment.sid, this.props.fid, this.props.segment.segment);

    }

    closeSegment() {

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

        if (this.state.status) {
            classes.push('status-' + this.state.status.toLowerCase());
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
        return classes;
    }

    hightlightEditarea(sid) {
        if (this.props.segment.sid == sid) {
            /*  TODO REMOVE THIS CODE
             *  The segment must know about his classes
             */
            let classes = $('#segment-' + this.props.segment.sid).attr("class").split(" ");
            if (!!classes.indexOf("modified")) {
                classes.push("modified");
                this.setState({
                    segment_classes: classes
                });
            }
        }
    }

    addClass(sid, newClass) {
        if (this.props.segment.sid == sid || sid === -1 || sid.toString().indexOf(this.props.segment.sid) !== -1) {
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

    setSegmentStatus(sid, status) {
        if (this.props.segment.sid == sid) {
            let classes = this.state.segment_classes.slice(0);
            let index = classes.findIndex(function (item) {
                return item.indexOf("status-") > -1;
            });

            if (index >= 0) {
                classes.splice(index, 1);
            }

            this.setState({
                segment_classes: classes,
                status: status
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

    checkSegmentClasses() {
        let classes = this.state.segment_classes.concat(this.createSegmentClasses());
        if (classes.indexOf("muted") > -1 && classes.indexOf("editor") > -1) {
            let indexEditor = classes.indexOf("editor");
            classes.splice(indexEditor, 1);
            let indexOpened = classes.indexOf("opened");
            classes.splice(indexOpened, 1);
        }
        return classes;
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
        SegmentStore.addListener(SegmentConstants.HIGHLIGHT_EDITAREA, this.hightlightEditarea);
        SegmentStore.addListener(SegmentConstants.ADD_SEGMENT_CLASS, this.addClass);
        SegmentStore.addListener(SegmentConstants.REMOVE_SEGMENT_CLASS, this.removeClass);
        SegmentStore.addListener(SegmentConstants.SET_SEGMENT_PROPAGATION, this.setAsAutopropagated);
        SegmentStore.addListener(SegmentConstants.SET_SEGMENT_STATUS, this.setSegmentStatus);
        SegmentStore.addListener(SegmentConstants.MOUNT_TRANSLATIONS_ISSUES, this.addTranslationsIssues);
    }


    componentWillUnmount() {
        SegmentStore.removeListener(SegmentConstants.HIGHLIGHT_EDITAREA, this.hightlightEditarea);
        SegmentStore.removeListener(SegmentConstants.ADD_SEGMENT_CLASS, this.addClass);
        SegmentStore.removeListener(SegmentConstants.REMOVE_SEGMENT_CLASS, this.removeClass);
        SegmentStore.removeListener(SegmentConstants.SET_SEGMENT_PROPAGATION, this.setAsAutopropagated);
        SegmentStore.removeListener(SegmentConstants.SET_SEGMENT_STATUS, this.setSegmentStatus);
        SegmentStore.removeListener(SegmentConstants.MOUNT_TRANSLATIONS_ISSUES, this.addTranslationsIssues);
    }

    componentWillReceiveProps(nextProps) {
        if (!this.props.segment.opened && nextProps.segment.opened) {
            UI.scrollSegment($(this.section), this.props.segment.sid);
        }
    }

    checkIfCanOpenSegment() {
        return (this.props.isReview && !this.props.segment.status == 'NEW' && !this.props.segment.status == 'DRAFT') || !this.props.isReview

    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            (!Immutable.fromJS(nextProps.segment).equals(Immutable.fromJS(this.props.segment))) ||
            (!Immutable.fromJS(nextState.segment_classes).equals(Immutable.fromJS(this.state.segment_classes))) ||
            (nextState.modified !== this.state.modified) ||
            (nextState.autopropagated !== this.state.autopropagated) ||
            (nextState.status !== this.state.status) ||
            (nextState.showTranslationIssues !== this.state.showTranslationIssues) ||
            (nextState.readonly !== this.state.readonly)
        );
    }

    render() {

        let job_marker = "",
            timeToEdit = "",
            readonly = this.state.readonly,
            segment_classes = this.checkSegmentClasses(),
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

        if (this.props.segment.opened) segment_classes.push('editor', 'opened');


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
                        canBeOpened={this.checkIfCanOpenSegment()}
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

