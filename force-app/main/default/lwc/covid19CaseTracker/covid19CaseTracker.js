import { LightningElement, track } from 'lwc';

const URL = "https://services9.arcgis.com/N9p5hsImWXAccRNI/arcgis/rest/services/Z7biAeD8PAkqgmWhxG2A/FeatureServer/1/query?f=json&where=Confirmed%20%3E%200&outFields=Country_Region,Confirmed,Deaths,Recovered,Last_Update,Active&orderByFields=Confirmed%20desc";
let initialValue ={
    total_deaths : 0,
    total_confirmed : 0,
    total_active : 0,
    total_recovered :0,
    total_fatality_rate : 0,
    total_recovery_rate : 0,
};

export default class Covid19CaseTracker extends LightningElement {

    
    @track 
    total= initialValue;
    defaultView = "LIST"; //To keep default view as a list. 
    showListView = true; // To switch view from list to chart and vice versa. 
    tableData=[]; // To store refined data of original JSON and other calculated data.
    filteredTableData=[]; // To store filtered data of tableData.
    
    
    //Getter methods to render user selected option
    get isChartSelected(){
        return this.defaultView === 'CHART' ? 'active':'';
    }
    get isListSelected(){
            return this.defaultView === 'LIST'  ? 'active':'';
    }

    // Using callback method to manage lifecycle of component and fire fetchData method after
    // component get loaded in DOM
    connectedCallback(){
        this.fetchData();
    }   


    // To fetch the data from server.
    async fetchData(){
        let response = await fetch(URL);
        let data = await response.json();
        // console.log(JSON.stringify(data));
        this.formatData(data);
    }

    // To format data for display.
    formatData(data){
        // To store the individual country's data because of JSON contains multiple entries of one country.
        let individualSum = { }; 
        data.features.forEach(features =>{
            let item = features["attributes"];
            // console.log(item);
            this.total.total_deaths += item.Deaths;
            this.total.total_confirmed += item.Confirmed;
            this.total.total_active += item.Active;
            this.total.total_recovered += item.Recovered;

            // Defining an object so later can be used to add sum 
            let obj = {
                Confirmed: item.Confirmed,
                Active: item.Active,
                Deaths: item.Deaths,
                Recovered: item.Recovered,
                Last_Update:item.Last_Update,
            };
            // Processing sum when multiple entries are found.
            if (item.Country_Region in individualSum) {
                individualSum[item.Country_Region].Confirmed += obj.Confirmed;
                individualSum[item.Country_Region].Active += obj.Active;
                individualSum[item.Country_Region].Deaths += obj.Deaths;
                individualSum[item.Country_Region].Recovered += obj.Recovered;
              } else {
                individualSum[item.Country_Region] = obj;
              }
        });
        this.total.total_fatality_rate = this.getFatalityRate().toFixed(2)+'%';
        this.total.total_recovery_rate = this.getRecoveryRate().toFixed(2)+'%';

        // Defining a new array of objects to iterate through LWC
        let finaldata = Object.keys(individualSum).map(data => {
            let item = individualSum[data];
            let formatedDate = new Date(item.Last_Update).toDateString();
            let Fatality_rate = this.getFatalityRate(item).toFixed(2)+'%';
            let Recovery_rate = this.getRecoveryRate(item).toFixed(2)+'%';
            return {...item, "Country_Region":data, "formatedDate":formatedDate,
                 "Fatality_rate":Fatality_rate, "Recovery_rate":Recovery_rate,
                  "Country_Region":data
                  }
        });

        //console.log(JSON.stringify(this.total));
        //console.log(individualSum);
        //console.log(JSON.stringify(finaldata));

        this.tableData = [...finaldata];
        this.filteredTableData = [...finaldata];
        
    }

    getFatalityRate(item){
        if(item){
            return (item.Deaths / item.Confirmed)*100;
        } else {
            return (this.total.total_deaths/this.total.total_confirmed)*100;
        }
        
    }
    getRecoveryRate(item){
        if(item){
                return (item.Recovered / item.Confirmed)*100;
        } else {
            return (this.total.total_recovered/this.total.total_confirmed)*100; 
        }            
    }

    // Function to support toggle between list and chart
    listHandler(event){
        // console.log('ping');
        this.defaultView = event.target.dataset.name;
        if(this.defaultView === "LIST"){
            this.showListView = true;
        }else{
            this.showListView = false;
            this.triggerCharts();
        }
    }

    //Function to filter data by country. 
    searchHandler(event) {
        //Getting value from user.
        let val = event.target.value ? event.target.value.trim().toLowerCase():event.target.value;
        //console.log(val);
        //Condition to check if country exists after removing whitespace and converting it to lower case
        if(val.trim()){
                let filterData = this.tableData.filter(item=>{
                        let country = item.Country_Region ? item.Country_Region.toLowerCase():item.Country_Region;
                          return country.includes(val);
                });
                this.filteredTableData=[...filterData];
        } else {
                this.filteredTableData=[...this.tableData];
        }
    }

    
}