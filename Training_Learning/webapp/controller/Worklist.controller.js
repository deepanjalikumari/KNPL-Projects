sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, formatter, Filter, FilterOperator) {
    "use strict";

    return BaseController.extend("com.knpl.pragati.Training_Learning.controller.Worklist", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
        onInit: function () {
            var oViewModel,
                iOriginalBusyDelay,
                oTable = this.byId("table"),
                oTable1 = this.byId("table1");

            // Put down worklist table's original value for busy indicator delay,
            // so it can be restored later on. Busy handling on the table is
            // taken care of by the table itself.
            iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
            // keeps the search state
            this._aTableSearchState = [];

            // Model used to manipulate control states
            oViewModel = new JSONModel({
                worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
                shareOnJamTitle: this.getResourceBundle().getText("worklistTitle"),
                shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
                shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
                tableNoDataTextTraining: this.getResourceBundle().getText("tableNoDataTextTraining"),
                tableNoDataTextVideo: this.getResourceBundle().getText("tableNoDataTextVideo"),
                tableBusyDelay: 0
            });
            this.setModel(oViewModel, "worklistView");

            // Make sure, busy indication is showing immediately so there is no
            // break after the busy indication for loading the view's meta data is
            // ended (see promise 'oWhenMetadataIsLoaded' in AppController)
            oTable.attachEventOnce("updateFinished", function () {
                // Restore original busy indicator delay for worklist's table
                oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
            });
            oTable1.attachEventOnce("updateFinished", function () {
                // Restore original busy indicator delay for worklist's table
                oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
            });
        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

		/**
		 * Triggered by the table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
        onUpdateFinished: function (oEvent) {
            // update the worklist's object counter after the table update
            var sTitle,
                oTable = oEvent.getSource(),
                iTotalItems = oEvent.getParameter("total");
            // only update the counter if the length is final and
            // the table is not empty
            if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
                sTitle = this.getResourceBundle().getText("trainingCount", [iTotalItems]);
            } else {
                sTitle = this.getResourceBundle().getText("training");
            }
            this.getModel("worklistView").setProperty("/training", sTitle);
        },

        onUpdateFinished1: function (oEvent) {
            // update the worklist's object counter after the table update
            var sTitle,
                oTable = oEvent.getSource(),
                iTotalItems = oEvent.getParameter("total");
            // only update the counter if the length is final and
            // the table is not empty
            if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
                sTitle = this.getResourceBundle().getText("videoCount", [iTotalItems]);
            } else {
                sTitle = this.getResourceBundle().getText("video");
            }
            this.getModel("worklistView").setProperty("/video", sTitle);
        },

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
        onPress: function (oEvent) {
            // The source is the list item that got pressed
            this._showObject(oEvent.getSource());
        },

		/**
		 * Event handler for navigating back.
		 * We navigate back in the browser history
		 * @public
		 */
        onNavBack: function () {
            // eslint-disable-next-line sap-no-history-manipulation
            history.go(-1);
        },


        onSearch: function (oEvent) {
            if (oEvent.getParameters().refreshButtonPressed) {
                // Search field's 'refresh' button has been pressed.
                // This is visible if you select any master list item.
                // In this case no new search is triggered, we only
                // refresh the list binding.
                this.onRefresh();
            } else {
                var aTableSearchState = [];
                var sQuery = oEvent.getParameter("query");

                if (sQuery && sQuery.length > 0) {
                    aTableSearchState = [new Filter("Title", FilterOperator.Contains, sQuery)];
                }
                this._applySearch(aTableSearchState);
            }

        },

        /**
         * When Click on Add button
         */
        onAddVideo: function (oEvent) {
            this.getRouter().navTo("createObject");
        },

        onAddTraining: function (oEvent) {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteAddEditT", {
                mode: "add",
                id: "null",
            });
        },

        onListItemPressTraining: function (oEvent) {
          var sPath = oEvent.getSource().getBindingContext().getPath().substr(1);
          console.log(sPath);
          var oRouter = this.getOwnerComponent().getRouter();
          oRouter.navTo("RouteTrainingTab", {
            mode: "edit",
            prop: window.encodeURIComponent(sPath),
          });
        },

        onEditTraining: function (oEvent) {
          var sPath = oEvent.getSource().getBindingContext().getPath().substr(1);
          console.log(sPath);

          var oRouter = this.getOwnerComponent().getRouter();
          oRouter.navTo("RouteTrainingtab", {
            mode: "edit",
            prop: window.encodeURIComponent(sPath),
          });
        },

        onRefreshView: function () {
            var oModel = this.getModel();
            oModel.refresh(true);
        },

        onEditVideo: function (oEvent) {
            this._showObject(oEvent.getSource());
        },

        onListItemPressVideo: function (oEvent) {
          this._showObject(oEvent.getSource());
        },

        onDeleteVideo: function (oEvent) {
            var sPath = oEvent.getSource().getBindingContext().getPath();

            function onYes() {
                var data = this.getModel().getData(sPath);
                this.getModel().update(sPath, {
                    IsArchived: true
                }, {
                    success: this.showToast.bind(this, "MSG_SUCCESS_VIDEO_REMOVE")
                });
            }
            this.showWarning("MSG_CONFIRM_VIDEO_DELETE", onYes);
        },

        onDeleteTraining: function (oEvent) {
            var sPath = oEvent.getSource().getBindingContext().getPath();

            function onYes() {
                var data = this.getModel().getData(sPath);
                this.getModel().update(sPath, {
                    IsArchived: true
                }, {
                    success: this.showToast.bind(this, "MSG_SUCCESS_TRAINING_REMOVE")
                });
            }
            this.showWarning("MSG_CONFIRM_TRAINING_DELETE", onYes);
        },

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
        onRefresh : function () {
            var oTable = this.byId("table");
            oTable.getBinding("items").refresh();
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

		/**
		 * Shows the selected item on the object page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
        _showObject : function (oItem) {
            debugger;
            this.getRouter().navTo("object", {
                objectId: oItem.getBindingContext().getProperty("Id")
            });
        },

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
		 * @private
		 */
        _applySearch: function (aTableSearchState) {
            var oTable = this.byId("table"),
                oViewModel = this.getModel("worklistView");
            oTable.getBinding("items").filter(aTableSearchState, "Application");
            // changes the noDataText of the list in case there are no filter results
            if (aTableSearchState.length !== 0) {
                oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
            }
        }

	});
});