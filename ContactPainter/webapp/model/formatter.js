sap.ui.define([], function () {
    "use strict";

    return {

		/**
		 * Rounds the number unit value to 2 digits
		 * @public
		 * @param {string} sValue the number string to be rounded
		 * @returns {string} sValue with 2 digits rounded
		 */
        numberUnit: function (sValue) {
            if (!sValue) {
                return "";
            }
            return parseFloat(sValue).toFixed(2);
        },

        formatURL: function (sURL) {

            if (sURL) {
                return ("https://").concat(location.host, "/KNPL_PAINTER_API", new URL(sURL).pathname);
            }
        },

        RegStatusIcon: function (sRegStatus) {
            switch (sRegStatus) {
                case "PENDING":
                    return "sap-icon://message-warning"
                case "REGISTERED":
                    return "sap-icon://message-success"
            }
        },

        RegStatusColor: function (sRegStatus) {

            switch (sRegStatus) {
                case "PENDING":
                    return sap.ui.core.IconColor.Critical;
                case "REGISTERED":
                    return sap.ui.core.IconColor.Positive;

            }

        },
        ProductProperty: function (sPath, sProperty) {
            var oProduct = this.getView().getModel().getData("/" + sPath),
                oPackDetails = this.getView().getModel().getData("/" + oProduct.ProductPackDetails.__ref)
          
            
            switch(sProperty){

                case "Product Name" :
                    return oPackDetails.Description;

                case "Total Points" :   
                    return oProduct.ProductQuantity*oProduct.Points;
                case "Category" : 
                     var cat = this.getView().getModel().getData("/"+ oPackDetails.ProductCategoryDetails.__ref);    
                    return cat.Category;


            }


            if (sProperty == "Product Name") {
                return oPackDetails.Description;
            }

            if (sProperty == "Total Points") {

            }




            return oProduct[sProperty];

            //   
        },
        PackDetails: function (sPath, sProperty) {
            var oProduct = this.getView().getModel().getData("/" + sPath)
          
        }

    };

});