/*
 * Copyright (c) 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * TodoActions
 */

var AppDispatcher = require('../dispatcher/AppDispatcher');
var SegmentConstants = require('../constants/SegmentConstants');
var SegmentStore = require('../stores/SegmentStore');

var SegmentActions = {
    /********* SEGMENTS *********/
    /**
     * @param segments
     * @param fid
     */
    renderSegments: function (segments, fid) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.RENDER_SEGMENTS,
            segments: segments,
            fid: fid
        });
    },
    splitSegments: function (oldSid, newSegments, splitGroup, fid) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.SPLIT_SEGMENT,
            oldSid: oldSid,
            newSegments: newSegments,
            splitGroup: splitGroup,
            fid: fid
        });
    },
    addSegments: function (segments, fid, where) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.ADD_SEGMENTS,
            segments: segments,
            fid: fid,
            where: where
        });
    },

    updateAllSegments: function () {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.UPDATE_ALL_SEGMENTS
        });
    },

    mountTranslationIssues: function () {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.MOUNT_TRANSLATIONS_ISSUES
        });
    },

    /********** Segment **********/

    setOpenSegment: function (sid, fid) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.SET_OPEN_SEGMENT,
            sid: sid,
            fid: fid
        });
    },

    openSegment: function (sid) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.OPEN_SEGMENT,
            sid: sid
        });
    },

    scrollToSegment: function (sid, fid) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.SCROLL_TO_SEGMENT,
            sid: sid,
            fid: fid
        });
    },

    addClassToSegment: function (sid, newClass) {
        setTimeout(function () {
            AppDispatcher.dispatch({
                actionType: SegmentConstants.ADD_SEGMENT_CLASS,
                id: sid,
                newClass: newClass
            });
        }, 0);
    },

    addClassToSegments: function (sidList, newClass) {
        setTimeout(function () {
            AppDispatcher.dispatch({
                actionType: SegmentConstants.ADD_SEGMENTS_CLASS,
                sidList: sidList,
                newClass: newClass
            });
        }, 0)
    },

    removeClassToSegment: function (sid, className) {
        setTimeout(function () {
            AppDispatcher.dispatch({
                actionType: SegmentConstants.REMOVE_SEGMENT_CLASS,
                id: sid,
                className: className
            });
        }, 0)
    },

    setStatus: function (sid, fid, status) {
        if (sid && fid) {
            AppDispatcher.dispatch({
                actionType: SegmentConstants.SET_SEGMENT_STATUS,
                id: sid,
                fid: fid,
                status: status
            });
        }
    },

    setHeaderPercentage: function (sid, fid, perc, className, createdBy) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.SET_SEGMENT_HEADER,
            id: sid,
            fid: fid,
            perc: perc,
            className: className,
            createdBy: createdBy
        });
    },

    hideSegmentHeader: function (sid, fid) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.HIDE_SEGMENT_HEADER,
            id: sid,
            fid: fid
        });
    },

    setSegmentPropagation: function (sid, fid, propagation, from) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.SET_SEGMENT_PROPAGATION,
            id: sid,
            fid: fid,
            propagation: propagation,
            from: from
        });
    },

    replaceSourceText: function (sid, fid, text) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.REPLACE_SOURCE,
            id: sid,
            fid: fid,
            source: text
        });
    },

    setSegmentAsTagged: function (sid, fid) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.SET_SEGMENT_TAGGED,
            id: sid,
            fid: fid,
        });
    },
    /**
     * Set the original translation of a segment.
     * Used to create the revision trackChanges
     * @param sid
     * @param fid
     * @param originalTranslation
     */
    addOriginalTranslation: function (sid, fid, originalTranslation) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.SET_SEGMENT_ORIGINAL_TRANSLATION,
            id: sid,
            fid: fid,
            originalTranslation: originalTranslation
        });
    },
    /**
     * Set status of operations request eg. setTranslation
     * @param sid
     * @param fid
     * @param operation - string of operation name
     * @param status - integer of status"
     * 0 : prepare to sending
     * 1 : pending
     * 2 : received data / completed
     * 3 : failed
     */
    setOperationStatus: function (sid, fid, operation, status) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.SET_OPERATION_STATUS,
            sid: sid,
            fid: fid,
            operation: operation,
            status: status
        });
    },
    disableTagLock: function () {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.DISABLE_TAG_LOCK
        });
    },
    enableTagLock: function () {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.ENABLE_TAG_LOCK
        });
    },
    /******************* EditArea ************/
    highlightEditarea: function (sid) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.HIGHLIGHT_EDITAREA,
            id: sid
        });
    },

    replaceEditAreaTextContent: function (sid, fid, text) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.REPLACE_TRANSLATION,
            id: sid,
            fid: fid,
            translation: text
        });
    },

    addClassToEditArea: function (sid, fid, className) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.ADD_EDITAREA_CLASS,
            id: sid,
            fid: fid,
            className: className
        });
    },
    /**
     *
     * @param sid
     * @param fid
     * @param status - True/False
     * Set modified to true/false inside segment
     */
    modifiedTranslation: function (sid, fid, status) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.MODIFIED_TRANSLATION,
            sid: sid,
            fid: fid,
            status: status
        });

    },
    updateTranslation: function (fid, sid, editAreaText) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.TRANSLATION_EDITED,
            fid: fid,
            id: sid,
            translation: editAreaText
        });
    },
    /************ FOOTER ***************/
    registerTab: function (tab, visible, open) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.REGISTER_TAB,
            tab: tab,
            visible: visible,
            open: open
        });
    },

    chooseContribution: function (sid, index) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.CHOOSE_CONTRIBUTION,
            sid: sid,
            index: index
        });
    },
    renderSegmentGlossary: function (sid, segment) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.RENDER_GLOSSARY,
            sid: sid,
            segment: segment
        });
    },

    activateTab: function (sid, tab) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.OPEN_TAB,
            sid: sid,
            data: tab
        });
    },
    closeTabs: function (sid) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.CLOSE_TABS,
            sid: sid,
            data: null
        });
    },


    renderPreview: function (sid, data) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.RENDER_PREVIEW,
            sid: sid,
            data: data
        });
    },

    getGlossaryMatch: function (text) {
        text = UI.removeAllTags(htmlEncode(text));
        text = text.replace(/\"/g, "");
        return API.SEGMENT.getGlossaryMatch(text)
            .fail(function () {
                UI.failedConnection(0, 'glossary');
            });
    },


    getGlossaryForSegment: function (sid, fid, text) {
        let requestes = [{
            sid: sid,
            fid: fid,
            text: text
        }];
        let nextSegment = SegmentStore.getNextSegment(sid, fid);
        if (nextSegment) {
            requestes.push({
                sid: nextSegment.sid,
                fid: nextSegment.fid,
                text: nextSegment.segment
            });
            let nextSegmentUntranslated = SegmentStore.getNextSegment(sid, fid, 8);
            if (nextSegmentUntranslated && requestes[1].sid != nextSegmentUntranslated.sid) {
                requestes.push({
                    sid: nextSegmentUntranslated.sid,
                    fid: nextSegmentUntranslated.fid,
                    text: nextSegmentUntranslated.segment
                });
            }
        }

        for (let index = 0; index < requestes.length; index++) {
            let request = requestes[index];
            let segment = SegmentStore.getSegmentByIdToJS(request.sid, request.fid);
            if (typeof segment.glossary === 'undefined') {
                API.SEGMENT.getGlossaryForSegment(request.text)
                    .done(function (response) {
                        UI.storeGlossaryData(request.sid, response.data.matches);
                        AppDispatcher.dispatch({
                            actionType: SegmentConstants.SET_GLOSSARY_TO_CACHE,
                            sid: request.sid,
                            fid: request.fid,
                            glossary: response.data.matches ? response.data.matches : []
                        });
                        // UI.markGlossaryItemsInSource(response.data.matches)
                    })
                    .fail(function (error) {
                        UI.failedConnection(sid, 'getContributions');
                    });
            }
        }

    },
    setQaCheckGlossaryItems(glossary) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.SET_QA_CHECK_GLOSSARY_TO_CACHE,
            glossary: glossary
        });
    },
    searchGlossary: function (sid, fid, text) {
        text = UI.removeAllTags(htmlEncode(text));
        text = text.replace(/\"/g, "");
        API.SEGMENT.getGlossaryMatch(text)
            .done(response => {
                AppDispatcher.dispatch({
                    actionType: SegmentConstants.SET_GLOSSARY_TO_CACHE,
                    sid: sid,
                    fid: fid,
                    glossary: response.data.matches ? response.data.matches : []
                });
            })
            .fail(function () {
                UI.failedConnection(0, 'glossary');
            });
    },
    deleteGlossaryItem: function (source, target) {
        return API.SEGMENT.deleteGlossaryItem(source, target)
            .fail(function () {
                UI.failedConnection(0, 'deleteGlossaryItem');
            });
    },

    addGlossaryItem: function (source, target, comment) {
        return API.SEGMENT.addGlossaryItem(source, target, comment)
            .fail(function () {
                UI.failedConnection(0, 'addGlossaryItem');
            });
    },

    updateGlossaryItem: function (idItem, source, target, newTranslation, comment, newComment) {
        return API.SEGMENT.updateGlossaryItem(idItem, source, target, newTranslation, comment, newComment)
            .fail(function () {
                UI.failedConnection(0, 'updateGlossaryItem');
            });
    },

    findConcordance: function (sid, data) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.FIND_CONCORDANCE,
            sid: sid,
            data: data
        });
    },

    /**
     *
     * @param sid
     * @param fid
     * @param target
     * @return contributions - dispatch contribution to store
     * Check if the current sid have contribution in cache, and if it not have contributions,
     * pull from api and store the data for it and next segment
     * After me, the action get the next segment and the next untranslated segment end get matches
     */
    getContributions: function (sid, fid, target) {
        let requestes = [{
            sid: sid,
            fid: fid,
            target: target
        }];
        let nextSegment = SegmentStore.getNextSegment(sid, fid);
        if (nextSegment) {
            requestes.push({
                sid: nextSegment.sid,
                fid: nextSegment.fid,
                target: nextSegment.segment
            });
            let nextSegmentUntranslated = SegmentStore.getNextSegment(sid, fid, 8);
            if (nextSegmentUntranslated && requestes[1].sid != nextSegmentUntranslated.sid) {
                requestes.push({
                    sid: nextSegmentUntranslated.sid,
                    fid: nextSegmentUntranslated.fid,
                    target: nextSegmentUntranslated.segment
                });
            }
        }
        for (let index = 0; index < requestes.length; index++) {
            let request = requestes[index];
            let segment = SegmentStore.getSegmentByIdToJS(request.sid, request.fid);
            if (!segment.contributions || (segment.contributions && segment.contributions.length === 0)) {
                API.SEGMENT.getContributions(request.sid, request.target)
                    .done(function (response) {
                        AppDispatcher.dispatch({
                            actionType: SegmentConstants.SET_CONTRIBUTIONS_TO_CACHE,
                            sid: request.sid,
                            fid: request.fid,
                            matches: response.data.matches
                        });
                    })
                    .fail(function (error) {
                        UI.failedConnection(sid, 'getContributions');
                    });
            }
        }

    },
    setChosenContributionIndex: function (sid, fid, index) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.SET_CHOSEN_CONTRIBUTION_INDEX,
            sid: sid,
            fid: fid,
            index: index
        });
    },
    /************ Revise ***************/
    showSelection: function (sid, data) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.SHOW_SELECTION,
            sid: sid,
            data: data
        });
    },

    openIssuesPanel: function (data) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.OPEN_ISSUES_PANEL,
            data: data,
        });

        UI.openIssuesPanel(data);
    },

    closeIssuesPanel: function () {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.CLOSE_ISSUES_PANEL
        });
    },

    showIssuesMessage: function (sid) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.SHOW_ISSUE_MESSAGE,
            sid: sid,
        });
    },

    renderReviseErrors: function (sid, data) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.RENDER_REVISE_ISSUES,
            sid: sid,
            data: data
        });
    },

    submitIssue: function (sid, data, diff) {
        return UI.submitIssues(sid, data, diff);
    },

    addTranslationIssuesToSegment: function (fid, sid, versions) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.ADD_SEGMENT_VERSIONS_ISSUES,
            fid: fid,
            sid: sid,
            versions: versions
        });
    },

    addSegmentVersionIssue: function (fid, sid, issue, versionNumber) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.ADD_SEGMENT_VERSION_ISSUE,
            fid: fid,
            sid: sid,
            issue: issue,
            versionNumber: versionNumber
        });
    },

    deleteIssue: function (issue) {
        UI.deleteIssue(issue);
    },

    confirmDeletedIssue: function (sid, issue_id) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.ISSUE_DELETED,
            sid: sid,
            data: issue_id
        });
    },

    submitComment: function (sid, idIssue, data) {
        return UI.submitComment(sid, idIssue, data);
    },

    toggleSegmentOnBulk: function (sid, fid) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.TOGGLE_SEGMENT_ON_BULK,
            fid: fid,
            sid: sid
        });
    },

    removeSegmentsOnBulk: function () {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.REMOVE_SEGMENTS_ON_BULK,
        });
        UI.setWaypoints();
    },

    setSegmentLocked(segment, fid, unlocked) {
        if (!unlocked) {
            //TODO: move this to SegmentActions
            UI.removeFromStorage('unlocked-' + segment.sid);
            if (segment.inBulk) {
                this.toggleSegmentOnBulk(segment.sid, fid);
            }
        } else {
            UI.addInStorage('unlocked-' + segment.sid, true);
            SegmentActions.openSegment(segment.sid);
        }
        AppDispatcher.dispatch({
            actionType: SegmentConstants.SET_UNLOCKED_SEGMENT,
            fid: fid,
            sid: segment.sid,
            unlocked: unlocked
        });
    },

    setBulkSelectionInterval(from, to, fid) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.SET_BULK_SELECTION_INTERVAL,
            from: from,
            to: to,
            fid: fid
        });
    },
    setBulkSelectionSegments(segmentsArray) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.SET_BULK_SELECTION_SEGMENTS,
            segmentsArray: segmentsArray
        });
        UI.setWaypoints();
    },
    setMutedSegments(segmentsArray) {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.SET_MUTED_SEGMENTS,
            segmentsArray: segmentsArray
        });
        UI.setWaypoints();
    },
    removeAllMutedSegments() {
        AppDispatcher.dispatch({
            actionType: SegmentConstants.REMOVE_MUTED_SEGMENTS
        });
    }


};

module.exports = SegmentActions;