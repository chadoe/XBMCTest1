(function (){
    var dataList = new WinJS.Binding.List();
    var resloader = new Windows.ApplicationModel.Resources.ResourceLoader();

// Create a namespace to make the data publicly
// accessible. 
var publicMembers =
    {
        itemList: dataList 
    };
WinJS.Namespace.define("Data", publicMembers); 

})();