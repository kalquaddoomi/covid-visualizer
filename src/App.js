import React, {useState, useEffect} from 'react';
import Axios from "axios";
import './App.css';


function App() {
    const TIME_TO_DEATH = 11
    const [covidData, setCovidData] = useState([]);
    const [population, setPopulation] = useState(0);
    const [covidAggs, setCovidAggs] = useState({
        total_deaths: 0,
        total_cases: 0,
        total_cases_less_eleven_days: 0,
        current_case_fatality: 0,
        likely_case_fatality: 0,
        likely_contagious: 0,
        max_case: 0,
        max_deaths: 0,
        max_deaths_date: '',
        max_cases_date: '',
    })
    const [lastFourteenDays, setLastFourteenDays] = useState([])
    useEffect(() => {
        Axios.get('https://www.census.gov/popclock/data/population.php/us?_=1609795225323').then(
            (response) => {
                if(response.status === 200) {
                    setPopulation(response.data.us.population)
                }
            }
        )
        Axios.get('https://raw.githubusercontent.com/nytimes/covid-19-data/master/us.csv').then(
        (response) => {
            if(response.status === 200) {
                let csvObject = []
                let lastFourteenDays = []
                let maxCasesDate = 0
                let maxDeathsDate = 0
                let maxCases = 0
                let maxDeaths = 0
                let currentContagious = 0
                let csvArray = response.data.split("\n");
                csvArray.forEach((row, i) => {
                   if(i > 0) {
                       let splitRow = row.split(",");

                       if( i > 1 ) {
                           let yesterDayRow = csvArray[i - 1].split(",");
                           let new_cases = splitRow[1] - yesterDayRow[1]
                           let new_deaths = splitRow[2] - yesterDayRow[2]
                           csvObject.push({
                               "date": `${splitRow[0]}`,
                               "total_cases": splitRow[1],
                               "total_deaths": splitRow[2],
                               "new_cases":new_cases,
                               "new_deaths":new_deaths,
                           })
                           if (new_cases > maxCases) {
                               maxCases = new_cases
                               maxCasesDate = splitRow[0]
                           }
                            if (new_deaths > maxDeaths) {
                                maxDeaths = new_deaths
                                maxDeathsDate = splitRow[0]
                            }

                       } else {
                           csvObject.push({
                               "date": `${splitRow[0]}`,
                               "total_cases": splitRow[1],
                               "total_deaths": splitRow[2],
                               "new_cases":1,
                               "new_deaths":0,
                           })
                       }

                       if( i > csvArray.length - 14) {
                           let yesterDayRow = csvArray[i - 1].split(",");
                           let elevenDaysAgo = csvArray[i - 11].split(",")
                           let tenDaysAgo = csvArray[i - 10].split(",")
                           lastFourteenDays.push({
                               "date": `${splitRow[0]}`,
                               "total_cases": splitRow[1],
                               "total_deaths": splitRow[2],
                               "new_cases":splitRow[1] - yesterDayRow[1],
                               "new_deaths":splitRow[2] - yesterDayRow[2],
                               "new_cases_11_days_ago":tenDaysAgo[1] - elevenDaysAgo[1],
                           })
                       }

                   }

                });

                let lastData = csvObject[csvObject.length - 1];
                let predictiveData = csvObject[csvObject.length - (TIME_TO_DEATH+1)];
                let contagiousData = csvObject[csvObject.length - 15];
                let weekData = csvObject[csvObject.length - 8]
                let twoWeekAgo = csvObject[csvObject.length - 15]
                let aggData = {
                    total_deaths: parseInt(lastData.total_deaths),
                    total_cases: parseInt(lastData.total_cases),
                    total_cases_less_eleven_days: parseInt(predictiveData.total_cases),
                    current_case_fatality: (lastData.total_deaths/lastData.total_cases),
                    likely_case_fatality: (lastData.total_deaths/predictiveData.total_cases),
                    likely_contagious: (lastData.total_cases - contagiousData.total_cases),
                    week_cases: parseInt(lastData.total_cases - weekData.total_cases),
                    week_before_cases: parseInt(weekData.total_cases - twoWeekAgo.total_cases),
                    week_deaths: parseInt(lastData.total_deaths - weekData.total_deaths),
                    week_before_deaths: parseInt(weekData.total_deaths - twoWeekAgo.total_deaths),
                    max_cases: maxCases,
                    max_cases_date: maxCasesDate,
                    max_deaths: maxDeaths,
                    max_deaths_date: maxDeathsDate,
                }
                setCovidAggs(aggData)
                setCovidData(csvObject)
                setLastFourteenDays(lastFourteenDays)
            }
        }
    )
    }, []);


    const covidReport = () => {
        if(covidData[0]) {
            let lastData = covidData[covidData.length - 1]
            return(
                <div className="panel-report">
                    <div>Last Updated: {lastData.date}</div>
                    <div className="panel-row">
                        <div className="panel-unit">
                            <h3>Cases Yesterday:</h3>
                            <p>{lastData.new_cases.toLocaleString()}</p>
                            <p className="panel-italics">
                                <p>Compared to worst day:</p>
                                <p>{((lastData.new_cases/covidAggs.max_cases)*100).toFixed(2)}%</p>
                            </p>
                        </div>
                        <div className="panel-unit">
                            <h3>Total Cases:</h3>
                            <p>{covidAggs.total_cases.toLocaleString()}</p>
                            <p className="panel-italics-tight">
                                <p>Current Estimated US Population: {population.toLocaleString()} </p>
                                <p>Percent Infected: {((covidAggs.total_cases / population)*100).toFixed(2)}%</p>
                                <p>Healthy Population: {(population - covidAggs.total_cases).toLocaleString()}</p>
                            </p>
                        </div>
                        <div className="panel-unit">
                            <h3>Deaths Yesterday:</h3>
                            <p>{lastData.new_deaths.toLocaleString()}</p>
                            <p className="panel-italics">
                                <p>Compared to worst day:</p>
                                <p>{((lastData.new_deaths/covidAggs.max_deaths)*100).toFixed(2)}%</p>

                            </p>
                        </div>
                        <div className="panel-unit">
                            <h3>Total Deaths:</h3>
                            <p>{covidAggs.total_deaths.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="panel-row">
                        <div className="panel-unit">
                            <h3>Total Cases Last 7 Days:</h3>
                            <p>{covidAggs.week_cases.toLocaleString()}</p>
                            <p className="panel-italics">
                                Previous 7 Days: {covidAggs.week_before_cases.toLocaleString()}
                            </p>
                        </div>
                        <div className="panel-unit">
                            <h3>Total Deaths Last 7 Days:</h3>
                            <p>{covidAggs.week_deaths.toLocaleString()}</p>
                            <p className="panel-italics">
                                Previous 7 Days: {covidAggs.week_before_deaths.toLocaleString()}
                            </p>
                        </div>
                        <div className="panel-unit">
                            <h3>Max Cases in a Day:</h3>
                            <p>{covidAggs.max_cases.toLocaleString()}</p>
                            <p className="panel-italics">
                                {covidAggs.max_cases_date}
                            </p>
                        </div>
                        <div className="panel-unit">
                            <h3>Max Deaths in a Day:</h3>
                            <p>{covidAggs.max_deaths.toLocaleString()}</p>
                            <p className="panel-italics">
                                {covidAggs.max_deaths_date}
                            </p>
                        </div>
                    </div>
                    <div className="panel-row">
                        <div className="panel-unit">
                            <h3>Case Fatality Rate from Total:</h3>
                            <p>{(100*covidAggs.current_case_fatality).toFixed(4)}%</p>
                        </div>
                        <div className="panel-unit">
                            <h3>Predicted Case Fatality Rate:</h3>
                            <p>{(100*covidAggs.likely_case_fatality).toFixed(4)}%</p>
                            <p className="panel-italics">
                                Based on a average of {TIME_TO_DEATH} days between new case and death
                            </p>
                        </div>
                        <div className="panel-unit">
                            <h3>Likely Actively Contagious:</h3>
                            <p>{covidAggs.likely_contagious.toLocaleString()}</p>
                            <p className="panel-italics">
                                Based on average 14 days contagious after symptom onset
                            </p>
                        </div>
                    </div>
                </div>
            )
        }
    }

    const covidTable = () => {
        return(
            lastFourteenDays.map((dataset) =>
                <tr>
                    <td>{dataset.date}</td>{/*<td>{new Date(dataset.date).toLocaleDateString()}</td>*/}
                    <td>{parseInt(dataset.new_cases).toLocaleString()}</td>
                    <td>{parseInt(dataset.total_cases).toLocaleString()}</td>
                    <td>{parseInt(dataset.new_deaths).toLocaleString()}</td>
                    <td>{parseInt(dataset.total_deaths).toLocaleString()}</td>
                </tr>
            )
        )
    }

    return (
    <div className="App">
        <div className="RecentInfo">
            {covidReport()}
        </div>
        <div className="">

        </div>
        <div className="FourteenDays">
            <table className="FourteenDaysTable">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>New Cases</th>
                        <th>Total Cases</th>
                        <th>New Deaths</th>
                        <th>Total Deaths</th>
                    </tr>
                </thead>
                <tbody>
                    {covidTable()}
                </tbody>
            </table>
        </div>
    </div>
    );
}

export default App;
