sap.ui.define([
    "com/knpl/pragati/DealerManagement/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    'sap/ui/model/Sorter',
    'sap/ui/core/Fragment',
    'sap/ui/Device'
],
    function (BaseController, Filter, FilterOperator, JSONModel, Sorter, Fragment, Device) {
        "use strict";

        return BaseController.extend("com.knpl.pragati.DealerManagement.controller.LandingPage", {
            onInit: function () {
                //Initializations
                var oViewModel,
                    iOriginalBusyDelay,
                    oTable = this.byId("idDealerTable");

                //adding searchfield association to filterbar                        
                this._addSearchFieldAssociationToFB();

                //Router Object
                this.oRouter = this.getRouter();
                this.oRouter.getRoute("RouteLandingPage").attachPatternMatched(this._onObjectMatched, this);

                // Put down worklist table's original value for busy indicator delay,
                // so it can be restored later on. Busy handling on the table is
                // taken care of by the table itself.
                iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
                // keeps the search state
                this._aTableSearchState = [];

                // Keeps reference to any of the created sap.m.ViewSettingsDialog-s in this sample
                this._mViewSettingsDialogs = {};

                // Model used to manipulate control states
                oViewModel = new JSONModel({
                    worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
                    tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
                    tableBusyDelay: 0
                });
                this.setModel(oViewModel, "worklistViewModel");

                // Make sure, busy indication is showing immediately so there is no
                // break after the busy indication for loading the view's meta data is
                // ended (see promise 'oWhenMetadataIsLoaded' in AppController)
                oTable.attachEventOnce("updateFinished", function () {
                    // Restore original busy indicator delay for worklist's table
                    oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
                });
            },

            _onObjectMatched: function (oEvent) { },

            _addSearchFieldAssociationToFB: function () {
                let oFilterBar = this.getView().byId("filterbar");
                let oSearchField = oFilterBar.getBasicSearch();
                var oBasicSearch;
                if (!oSearchField) {
                    // @ts-ignore
                    oBasicSearch = new sap.m.SearchField({
                        id: "idSearch",
                        showSearchButton: false
                    });
                } else {
                    oSearchField = null;
                }

                oFilterBar.setBasicSearch(oBasicSearch);

                oBasicSearch.attachBrowserEvent("keyup", function (e) {
                    if (e.which === 13) {
                        this.onSearch();
                    }
                }.bind(this)
                );
            },

            onUpdateFinished: function (oEvent) {
                // update the worklist's object counter after the table update
                var sTitle,
                    oTable = oEvent.getSource(),
                    iTotalItems = oEvent.getParameter("total");
                // only update the counter if the length is final and
                // the table is not empty
                if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
                    sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
                } else {
                    sTitle = this.getResourceBundle().getText("worklistTableTitle");
                }
                this.getViewModel("worklistViewModel").setProperty("/worklistTableTitle", sTitle);
            },

            onSearch: function (oEvent) {
                //console.log(oEvent.getSource().getBasicSearchValue());
                var aCurrentFilterValues = [];

                aCurrentFilterValues.push(oEvent.getSource().getBasicSearchValue());
                aCurrentFilterValues.push(this.getInputText("idPlantCode"));
                aCurrentFilterValues.push(this.getInputText("idDepot"));
                aCurrentFilterValues.push(this.getInputText("idSalesGroupName"));
                aCurrentFilterValues.push(this.getInputText("idFiscalYear"));

                this.filterTable(aCurrentFilterValues);

            },

            getInputText: function (controlId) {
                return this.getView().byId(controlId).getValue();
            },

            filterTable: function (aCurrentFilterValues) {
                this.getTableItems().filter(this.getFilters(aCurrentFilterValues));
            },

            getTableItems: function () {
                return this.getView().byId("idDealerTable").getBinding("items");
            },


            getFilters: function (aCurrentFilterValues) {
                var aFilters = [];

                var aKeys = [
                    "search", "tolower(PlantCode)", "tolower(Depot)", "tolower(SalesGroupName)", "tolower(FiscalYear)"
                ];

                for (let i = 0; i < aKeys.length; i++) {
                    if (aCurrentFilterValues[i].length > 0 && aKeys[i] !== "search")
                        aFilters.push(new Filter(aKeys[i], sap.ui.model.FilterOperator.Contains,  "'" + aCurrentFilterValues[i].trim().toLowerCase().replace("'", "''") + "'"))
                    else if (aCurrentFilterValues[i].length > 0 && aKeys[i] == "search")
                        this.SearchInAllFields(aKeys, aFilters, aCurrentFilterValues[i]);
                }
                
                return aFilters;
            },
            SearchInAllFields: function (aKeys, aFilters, searchValue) {


                for (let i = 1; i < aKeys.length; i++) {

                    aFilters.push(new Filter(aKeys[i], sap.ui.model.FilterOperator.Contains,  "'" + searchValue.trim().toLowerCase().replace("'", "''") + "'"))
                    
                }
                

            },



            handleSortButtonPressed: function () {
                this.getViewSettingsDialog("com.knpl.pragati.DealerManagement.view.fragments.worklistFragments.SortDialog")
                    .then(function (oViewSettingsDialog) {
                        oViewSettingsDialog.open();
                    });
            },

            handleFilterButtonPressed: function () {
                this.getViewSettingsDialog("com.knpl.pragati.DealerManagement.view.fragments.worklistFragments.FilterDialog")
                    .then(function (oViewSettingsDialog) {
                        oViewSettingsDialog.open();
                    });
            },


            getViewSettingsDialog: function (sDialogFragmentName) {
                var pDialog = this._mViewSettingsDialogs[sDialogFragmentName];

                if (!pDialog) {
                    pDialog = Fragment.load({
                        id: this.getView().getId(),
                        name: sDialogFragmentName,
                        controller: this
                    }).then(function (oDialog) {
                        if (Device.system.desktop) {
                            oDialog.addStyleClass("sapUiSizeCompact");
                        }
                        return oDialog;
                    });
                    this._mViewSettingsDialogs[sDialogFragmentName] = pDialog;
                }
                return pDialog;
            },

            handleSortDialogConfirm: function (oEvent) {
                var oTable = this.byId("idDealerTable"),
                    mParams = oEvent.getParameters(),
                    oBinding = oTable.getBinding("items"),
                    sPath,
                    bDescending,
                    aSorters = [];

                sPath = mParams.sortItem.getKey();
                bDescending = mParams.sortDescending;
                aSorters.push(new Sorter(sPath, bDescending));

                // apply the selected sort and group settings
                oBinding.sort(aSorters);
            },

            handleFilterDialogConfirm: function (oEvent) {
                var oTable = this.byId("idDealerTable"),
                    mParams = oEvent.getParameters(),
                    oBinding = oTable.getBinding("items"),
                    aFilters = [];

                var sPath = Object.keys(mParams.filterCompoundKeys)[0],
                    sOperator = "EQ",
                    sValue1 = mParams.filterKeys.false ? false : true,
                    oFilter = new Filter(sPath, sOperator, sValue1);

                aFilters.push(oFilter);

                // apply filter settings
                oBinding.filter(aFilters);
            },

            onListItemPress: function (oEvent) {
                var oItem = oEvent.getSource();
                oItem.setNavigated(true);
                var oBindingContext = oItem.getBindingContext();
                var oModel = this.getComponentModel();
                this.oRouter.navTo("RouteDetailsPage", {
                    dealerID: oEvent.getSource().getBindingContext().getObject().Id
                });
                this.presentBusyDialog();
            },
            onReset: function () {
               
                this._ResetFilterBar();
       

            },
            _ResetFilterBar: function () {
          var aCurrentFilterValues = [];
          var aResetProp = {
            PlantCode: "",
            Depot: "",
            SalesGroupName: "",
            FiscalYear: "",
          };
          var oViewModel = this.getView().getModel();
          oViewModel.setProperty("/filterBar", aResetProp);
          
          var oTable = this.byId("idDealerTable");
          var oBinding = oTable.getBinding("items");
          oBinding.filter([]);
        },

            // handleSuggest: function (oEvent) {
            //     var aFilters = [];
            //     var sTerm = oEvent.getParameter("suggestValue");
            //     if (sTerm) {
            //         aFilters.push(new sap.ui.model.Filter("FiscalYear", sap.ui.model.FilterOperator.Contains, sTerm));
            //     }
            //     oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
            //     //do not filter the provided suggestions before showing them to the user - important
            //     oEvent.getSource().setFilterSuggests(false);
            // }

            /*onDetailPress: function (oEvent) {
                var oButton = oEvent.getSource();
                this.byId("actionSheet").openBy(oButton);
            }*/

        });
    });
