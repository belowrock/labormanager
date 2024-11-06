sap.ui.define(["sap/ui/core/format/DateFormat"], function (DateFormat) {
  "use strict";
  return {
    formatDate: function (dateString) {
      if (!dateString) {
        return "-";
      }
      var date = new Date(dateString);
      var day = String(date.getDate()).padStart(2, "0");
      var month = String(date.getMonth() + 1).padStart(2, "0");
      var year = date.getFullYear();
      return day + "." + month + "." + year;
    },
    formatTime: function (val) {
      if (val !== null && val !== undefined) {
        if (val.ms !== 0) {
          // Use "HH:mm:ss" pattern to include seconds
          var timeFormat = DateFormat.getTimeInstance({
            pattern: "HH:mm",
          });
          var TZOffsetMs = new Date(0).getTimezoneOffset() * 60 * 1000;
          return timeFormat.format(new Date(val.ms + TZOffsetMs));
        } else {
          return "-";
        }
      }
      return "-";
    },

    formatCount: function (count) {
      if (!count) {
        return "0";
      }
      // Return the count of items in the results array
      return count.length;
    },
    formatState: function (bState) {
      if (bState) {
        return "Görevlendirildi";
      } else return "Boş";
    },
    formatTextColor: function (bState) {
      return bState ? "Success" : "Error"; // Use 'Success' for green, 'Error' for red
    },
    formatMngDesc: function (descStr) {
      if (!descStr) {
        return "-";
      } else return descStr;
    },
    formatMngUName: function (MngStr) {
      if (!MngStr) {
        return "-";
      } else return MngStr;
    },
    formatCurrentDate: function () {
      // Create a date formatter with the desired pattern
      var oDateFormat = DateFormat.getDateInstance({
        pattern: "dd.MM.yyyy",
      });
      var oCurrentDate = new Date(); // Get the current date
      return oDateFormat.format(oCurrentDate);
    },

    formatIconSource: function (bState, sSystemDate) {
      var sCurrentDate = new Date();
      var sDay = sCurrentDate.getDate();
      if (sDay < 10) {
        sDay = "0" + sDay;
      }
      var sMonth = sCurrentDate.getMonth() + 1;
      var sYear = sCurrentDate.getFullYear();
      var sFullDate = `${sDay}.${sMonth}.${sYear}`;
      if (sFullDate == sSystemDate && !bState) {
        return "sap-icon://pending";
      } else {
        return bState ? "sap-icon://message-success" : "sap-icon://sys-cancel";
      }
    },

    formatIconColor: function (bState, sSystemDate) {
      var sCurrentDate = new Date();
      var sDay = sCurrentDate.getDate();
      if (sDay < 10) {
        sDay = "0" + sDay;
      }
      var sMonth = sCurrentDate.getMonth() + 1;
      var sYear = sCurrentDate.getFullYear();
      var sFullDate = `${sDay}.${sMonth}.${sYear}`;
      if (sFullDate == sSystemDate && !bState) {
        return "Critical";
      } else {
        return bState ? "Positive" : "Negative";
      }
    },
    formatHighlight: function (bState, sSystemDate) {
      var sCurrentDate = new Date();
      var sDay = sCurrentDate.getDate();
      if (sDay < 10) {
        sDay = "0" + sDay;
      }
      var sMonth = sCurrentDate.getMonth() + 1;
      var sYear = sCurrentDate.getFullYear();
      var sFullDate = `${sDay}.${sMonth}.${sYear}`;
      if (sFullDate == sSystemDate && !bState) {
        return "Warning";
      } else {
        return bState ? "Success" : "Error";
      }
    },
    formatPercentage: function (iPercent, iAll) {
      if (iAll <= 10) {
        if (iPercent < 25) {
          return "Success";
        } else if (iPercent > 25 && iPercent < 50) {
          return "Warning";
        } else return "Error";
      } else if (iAll > 25) {
        if (iPercent < 20) {
          return "Success";
        } else if (iPercent > 20 && iPercent < 50) {
          return "Warning";
        } else return "Error";
      } else {
        if (iPercent < 10) {
          return "Success";
        } else if (iPercent > 10 && iPercent < 25) {
          return "Warning";
        } else return "Error";
      }
    },
    formatLinkVisibility: function (sDesc) {
      if (sDesc.length < 25) {
        return false;
      }
    },
  };
});
