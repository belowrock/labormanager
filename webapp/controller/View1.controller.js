sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library",
  ],
  function (
    Controller,
    JSONModel,
    formatter,
    Fragment,
    MessageToast,
    Filter,
    FilterOperator,
    Spreadsheet,
    library
  ) {
    "use strict";

    return Controller.extend("com.nagarro.labormanager.controller.View1", {
      formatter: formatter,
      onInit: function () {
        var oView = this.getView();
        var oModel = oView.getModel();

        if (!oModel) {
          oView.attachModelContextChange(function () {
            oModel = oView.getModel();
            if (oModel) {
              oModel.setSizeLimit(500);
            }
          });
        } else {
          oModel.setSizeLimit(500);
        }
        //COUNT MODEL (ICONTABBAR)
        var tableCountsModel = new JSONModel({
          waitingCount: 0,
          deployedCount: 0,
          logCount: 0,
        });
        this.getOwnerComponent().setModel(tableCountsModel, "tableCounts");

        //INPUT MODEL
        var oInputCatcher = new JSONModel({
          mngInput: "",
          mngEdit: "",
          searchBarInput: "",
          startDateInput: null,
          endDateInput: null,
          percentage: 0,
          searchBarInputWaiting: "",
          dateRangeEnabled: true,
          dateRangeVisible: false,
          genericTabVis: false,
          deployed: 0,
          rejected: 0,
          deployedDisplayedVal: "",
          rejectedDisplayedVal: "",
          aFilters: [],
          aLogFilters: [],
          iAll: 0,
        });
        this.getView().setModel(oInputCatcher, "inputCatcher");
      },

      onAfterRendering: function () {
        var oLogTable = this.getView().byId("logTab");
        var that = this;
        var oLogBinding = oLogTable.getBinding("items");

        oLogBinding.attachEventOnce("dataReceived", function () {
          var aItems = oLogBinding.getContexts().map(function (oContext) {
            return oContext.getObject();
          });

          var aUniqueItems = aItems.filter(function (item, index, self) {
            return (
              index === self.findIndex((t) => t.EmFullName === item.EmFullName)
            );
          });

          // Create a new JSON model with unique EmFullName entrie
          var oUniqueModel = new JSONModel({
            UniqueLogSet: aUniqueItems,
          });

          that.getView().setModel(oUniqueModel, "uniqueLogModel");
          // that._updateTableCounts();
        });
      },

      onPress: function (oEvent) {
        var oSelectedItem = oEvent.getSource();
        var oContext = oSelectedItem.getBindingContext(); // Binding to WaitingModel
        this._oSelectedItem = oSelectedItem;
        // Get username for update and store it in a controller variable
        var sUserName = oContext.getProperty("EmFullName");
        this._sSelectedUserName = sUserName;

        // Get the selected data
        var oSelectedData = oContext.getObject();

        // Create a JSON model to store the selected row data
        var oDialogModel = new JSONModel(oSelectedData);
        this._oDialogModel = oDialogModel; // Store the model as a controller variable

        var oView = this.getView();

        //LOADING THE DIALOG
        if (!this._oDialog) {
          Fragment.load({
            id: oView.getId(),
            name: "com.nagarro.labormanager.view.AssignDialog",
            controller: this,
          }).then(
            function (oDialog) {
              // Store the dialog reference
              this._oDialog = oDialog;
              //DEPENDANT TO THE VİEW
              oView.addDependent(this._oDialog);

              // Set the model to the dialog
              this._oDialog.setModel(oDialogModel, "dialogModel");

              // Open the dialog
              this._oDialog.open();
            }.bind(this)
          );
        } else {
          // If CREATED OPEN
          this._oDialog.setModel(oDialogModel, "dialogModel");
          this._oDialog.open();
        }
      },

      onSave: function () {
        var oDialogModel = this._oDialogModel.getData();
        var oModel = this.getView().getModel();
        var oInputModel = this.getView().getModel("inputCatcher");
        var sMngDesc = oInputModel.getData().mngInput;
        //TRIM FOR SPACES
        var sTrimmedMngDesc = sMngDesc.trim();
        if (sTrimmedMngDesc.length < 6) {
          MessageToast.show("Lütfen en az 6 karakter giriniz!");
          return;
        }
        //UPDATING THE OBJECT
        oDialogModel.MngDesc = sTrimmedMngDesc;
        oDialogModel.State = true;
        //REQUEST PATH WITH KEYS
        var sUpdatePath = this._oSelectedItem
          .getBindingContext()
          .getObject()
          .__metadata.uri.split("ZMBIS_SEGW_ACT_SRV")[1];

        var that = this;
        oModel.setHeaders({
          "X-Requested-With": "X",
        });
        //UPDATE THE DATA BASED ON REQUEST
        oModel.update(sUpdatePath, oDialogModel, {
          success: function () {
            MessageToast.show("Kayıt başarıyla oluşturuldu!");

            //CLEAR INPUT AND CLOSE
            var oDialog = that.byId("assign");

            // Close the dialog
            if (oDialog) {
              oDialog.close();
            }
            //CLEAR INPUT
            that._clearInputFields();
            that.onRefreshTab();
          },
          error: function (oError) {
            MessageToast.show("Kayıt oluşturulamadı!");
          },
        });
      },
      onCancel: function (oEvent) {
        var oSource = oEvent.getSource();

        var oDialog = oSource.getParent();

        // Close the dialog if it's open
        if (oDialog && oDialog.isOpen()) {
          oDialog.close();
        }
        this._clearInputFields();
      },
      _clearInputFields: function () {
        var oInputModel = this.getView().getModel("inputCatcher");
        oInputModel.getData().mngInput = "";
        oInputModel.getData().searchBarInput = "";
        oInputModel.getData().startDateInput = null;
        oInputModel.getData().endDateInput = null;
        oInputModel.getData().searchBarInputWaiting = "";
        oInputModel.getData().mngEdit = "";

        oInputModel.refresh(true);
      },
      onRefreshTab: function () {
        var oWaitingTab = this.getView().byId("waitingTable");
        var oLogTab = this.getView().byId("logTab");
        var oDeployedTable = this.getView().byId("deployedTable");
        var aTables = [oWaitingTab, oLogTab, oDeployedTable];

        aTables.forEach(function (oTable) {
          var oBinding = oTable.getBinding("items");
          oBinding.refresh(true);
        });
      },
      onFilter: function () {
        var oInputModel = this.getView().getModel("inputCatcher"),
          aFilters = oInputModel.getData().aFilters,
          aLogFilters = oInputModel.getData().aLogFilters,
          oInputModel = this.getView().getModel("inputCatcher"),
          sQuery = oInputModel.getData().searchBarInput,
          sQueryVal = sQuery ? sQuery.toUpperCase() : "";

        //Turkish
        sQueryVal = sQueryVal.replaceAll("İ", "I");

        //delete filters
        aFilters = [];
        aLogFilters = [];

        // Get start and end dates from the DateRangeSelection
        var oStartDate = oInputModel.getProperty("/startDateInput");
        var oEndDate = oInputModel.getProperty("/endDateInput");

        // Function to format dates as yyyyMMdd
        function formatDate(date) {
          var yyyy = date.getFullYear();
          var mm = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
          var dd = String(date.getDate()).padStart(2, "0");
          return yyyy + mm + dd;
        }

        // If dates are not null, format them to yyyyMMdd
        var sFormattedStartDate = oStartDate
          ? formatDate(new Date(oStartDate))
          : null;
        var sFormattedEndDate = oEndDate
          ? formatDate(new Date(oEndDate))
          : null;

        if (sFormattedEndDate && sFormattedStartDate) {
          aLogFilters.push(
            new Filter({
              filters: [
                new Filter("EmFilName", FilterOperator.Contains, sQueryVal),
                new Filter("EmFilSurname", FilterOperator.Contains, sQueryVal),

                new Filter(
                  "SystemDate",
                  FilterOperator.BT,
                  sFormattedStartDate,
                  sFormattedEndDate
                ),
              ],
              and: true,
            })
          );
        } else {
          aLogFilters.push(
            new Filter({
              filters: [
                new Filter("EmFilName", FilterOperator.Contains, sQueryVal),
                new Filter("EmFilSurname", FilterOperator.Contains, sQueryVal),
              ],
              and: true,
            })
          );
        }
        aFilters.push(
          new Filter({
            filters: [
              new Filter("EmFilName", FilterOperator.Contains, sQueryVal),
              new Filter("EmFilSurname", FilterOperator.Contains, sQueryVal),
            ],
            and: true,
          })
        );
        oInputModel.setProperty("/aFilters", aFilters);
        oInputModel.setProperty("/aLogFilters", aLogFilters);
        this.onFilterEmployee();
      },

      onFilterEmployee: function () {
        var oInputModel = this.getView().getModel("inputCatcher");
        var aFilters = oInputModel.getData().aFilters;
        var aLogFilters = oInputModel.getData().aLogFilters;

        var oLogTable = this.getView().byId("logTab");
        var oWaitingTable = this.getView().byId("waitingTable");
        var oDeployedTable = this.getView().byId("deployedTable");

        var oLogBinding = oLogTable.getBinding("items");
        var oWaitingBinding = oWaitingTable.getBinding("items");
        var oDeployedBinding = oDeployedTable.getBinding("items");
        oLogBinding.filter(aLogFilters);
        oWaitingBinding.filter(aFilters);
        oDeployedBinding.filter(aFilters);
      },

      onRefreshDat: function () {
        this._clearInputFields();
        this.onFilter();
      },

      //UPDATING ICONTABBAR COUNTS
      _updateTableCounts: function () {
        var oInputCatcher = this.getView().getModel("inputCatcher");
        var oCountModel = this.getView().getModel("tableCounts");
        var waitingCount = this.getView()
          .byId("waitingTable")
          .getBinding("items")
          .getLength();
        var deployedCount = this.getView()
          .byId("deployedTable")
          .getBinding("items")
          .getLength();
        var logCount = this.getView()
          .byId("logTab")
          .getBinding("items")
          .getLength();

        if (waitingCount == 0) {
          oInputCatcher.setProperty("/genericTabVis", false);
        } else oInputCatcher.setProperty("/genericTabVis", true);

        oCountModel.setProperty("/waitingCount", waitingCount);
        oCountModel.setProperty("/deployedCount", deployedCount);
        oCountModel.setProperty("/logCount", logCount);
        this._updateChartValues();
      },

      onChangeTab: function (oEvent) {
        var oInputModel = this.getView().getModel("inputCatcher");
        var sKey = oEvent.getSource().getSelectedKey();
        switch (sKey) {
          case "All":
            // oInputModel.setProperty("/dateRangeEnabled", true);
            oInputModel.setProperty("/dateRangeVisible", true);

            break;
          case "waiting":
            // oInputModel.setProperty("/dateRangeEnabled", false);
            oInputModel.setProperty("/dateRangeVisible", false);

            break;
          case "deployed":
            // oInputModel.setProperty("/dateRangeEnabled", false);
            oInputModel.setProperty("/dateRangeVisible", false);

            break;
        }
      },
      onGenericTagChart: function (oEvent) {
        var oButton = oEvent.getSource();
        var oView = this.getView();
        if (!this._pPopover) {
          this._pPopover = Fragment.load({
            id: oView.getId(),
            name: "com.nagarro.labormanager.view.donutChart",
            controller: this,
          }).then(function (oPopover) {
            oView.addDependent(oPopover);
            // oPopover.bind(this);
            return oPopover;
          });
          this._pPopover.then(function (oPopover) {
            oPopover.openBy(oButton);
          });
        } else {
          this._pPopover.then(function (oPopover) {
            oPopover.openBy(oButton);
          });
        }
        this._updateChartValues();
      },
      _updateChartValues: function () {
        var oModel = this.getView().getModel(),
          oTable = this.getView().byId("logTab"),
          aItems = oTable.getBinding("items").getContexts(),
          oInputCatcher = this.getView().getModel("inputCatcher"),
          aLogFilters = oInputCatcher.getData().aLogFilters,
          oTableCounts = this.getView().getModel("tableCounts");

        oModel.read("/LogSet", {
          filters: [aLogFilters],
          success: function (oData) {
            var iDeployedCount = 0,
              iRejectedCount = 0,
              iAll = 0,
              iRejectedPer = 0;
            oData.results.forEach(function (oItem) {
              if (oItem.State === true) {
                iDeployedCount++;
              } else if (oItem.State === false) {
                iRejectedCount++;
              }
            });

            iAll = oData.results.length;
            iRejectedPer = Math.round((iRejectedCount / iAll) * 100);

            // Counts
            oInputCatcher.setProperty("/deployed", iDeployedCount);
            oInputCatcher.setProperty("/rejected", iRejectedCount);
            oInputCatcher.setProperty("/rejectedDisplayedVal", iRejectedPer);
            oInputCatcher.setProperty("/iAll", iAll);
          },
        });
      },
      onExcelExport: function () {
        var EdmType = library.EdmType;
        var oTable = this.byId("logTab");
        var oBinding = oTable.getBinding("items");

        var aCols = [
          {
            label: "İsim",
            property: "EmFullName",
            type: "string",
          },
          {
            label: "Açıklama",
            property: "Description",
            type: "string",
          },
          {
            label: "Yönetici İsmi",
            property: "MngFullName",
            type: "string",
          },
          {
            label: "Yönetici Açıklaması",
            property: "MngDesc",
            type: "string",
          },
          {
            label: "Tarih",
            property: "SystemDateStr",
            type: "string",
            format: "yyyy-MM-dd", // Adjust to your preferred format
          },
          {
            label: "Durum",
            property: "State",
            type: EdmType.Boolean,
            trueValue: "Görevli",
            falseValue: "Görevsiz",
          },
        ];

        // Set up export settings
        var oSettings = {
          workbook: {
            columns: aCols,
          },
          dataSource: oBinding,
          fileName: "Kayıtlar.xlsx",
        };

        // Create the Spreadsheet and trigger export
        var oSheet = new Spreadsheet(oSettings);
        oSheet
          .build()
          .then(function () {
            MessageToast.show("Excel indirildi!");
          })
          .finally(function () {
            oSheet.destroy();
          });
      },
      onGenericTagPress: function () {
        this.onRefreshDat();
        this.getView().byId("iconTabBar").setSelectedKey("waiting");
      },
      onPressEdit: function (oEvent) {
        var oSelectedItem = oEvent.getSource();
        var oContext = oSelectedItem.getBindingContext();
        this._oEditSelectedItem = oSelectedItem;

        var sUserName = oContext.getProperty("EmFullName");
        this._sEditSelectedUserName = sUserName;

        var oSelectedData = oContext.getObject();

        var oDialogModel = new sap.ui.model.json.JSONModel(oSelectedData);
        this._oEditDialogModel = oDialogModel;

        var oView = this.getView();

        if (!this._oEditDialog) {
          sap.ui.core.Fragment.load({
            id: oView.getId(),
            name: "com.nagarro.labormanager.view.EditDialog",
            controller: this,
          }).then(
            function (oDialog) {
              this._oEditDialog = oDialog;
              oView.addDependent(this._oEditDialog);
              this._oEditDialog.setModel(oDialogModel, "editDialogModel");

              this._oEditDialog.open();
            }.bind(this)
          );
        } else {
          this._oEditDialog.setModel(oDialogModel, "editDialogModel");
          this._oEditDialog.open();
        }
      },
      onEditDesc: function () {
        var oDialogModel = this._oEditDialogModel.getData();
        var oModel = this.getView().getModel();
        var oInputModel = this.getView().getModel("inputCatcher");
        var sMngEdit = oInputModel.getData().mngEdit;
        //TRIM FOR SPACES
        var sTrimmedMngDesc = sMngEdit.trim();
        if (sTrimmedMngDesc.length < 6) {
          MessageToast.show("Lütfen en az 6 karakter giriniz!");
          return;
        }
        sTrimmedMngDesc = "Düzenlendi: " + sTrimmedMngDesc;
        //UPDATING THE OBJECT
        oDialogModel.MngDesc = sTrimmedMngDesc;
        oDialogModel.State = true;
        //REQUEST PATH WITH KEYS
        var sUpdatePath = this._oEditSelectedItem
          .getBindingContext()
          .getObject()
          .__metadata.uri.split("ZMBIS_SEGW_ACT_SRV")[1];

        var that = this;
        oModel.setHeaders({
          "X-Requested-With": "X",
        });
        //UPDATE THE DATA BASED ON REQUEST ---- AND CREATE/UPDATE FOR LOG TABLE
        oModel.update(sUpdatePath, oDialogModel, {
          success: function () {
            MessageToast.show("Kayıt başarıyla oluşturuldu!");

            //CLEAR INPUT AND CLOSE
            var oDialog = that.byId("assign");

            // Close the dialog
            if (oDialog) {
              oDialog.close();
            }
            //CLEAR INPUT
            that._clearInputFields();
            that.onRefreshTab();
          },
          error: function (oError) {
            MessageToast.show("Kayıt oluşturulamadı!");
          },
        });
      },
      onToggleText: function (oEvent) {
        var oBindingContext = oEvent.getSource().getBindingContext();
        var sPath = oBindingContext.getPath();

        // Get the current value of "showFullText"
        var bShowFullText = oBindingContext.getProperty("showFullText");

        // Toggle the "showFullText" property
        oBindingContext
          .getModel()
          .setProperty(sPath + "/showFullText", !bShowFullText);
      },
    });
  }
);
