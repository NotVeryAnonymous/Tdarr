import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import ReactDOM from 'react-dom';
import { Meteor } from 'meteor/meteor';

import ToggleButton from 'react-toggle-button'
import Modal from "reactjs-popup";

import { render } from 'react-dom';

import { Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.css';


import { StatisticsDB, FileDB, GlobalSettingsDB, ClientDB } from '../api/tasks.js';

import Workers from '../ui/tab_Transcoding_Worker.jsx';
import ReactTable from "react-table";

import Slider from 'react-input-slider';

import ItemButton from './item_Button.jsx'

import ClipLoader from 'react-spinners/ClipLoader';
import Checkbox from '@material-ui/core/Checkbox';

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';




var ButtonStyle = {
  display: 'inline-block',
}



const borderRadiusStyle = { borderRadius: 2 }


// App component - represents the whole app
class App extends Component {

  constructor(props) {
    super(props);

    this.state = { value: true, lowCPU: true, x: 1, }



  }





  alterWorkerLimit(process,workerType){



    var globsettings = this.props.globalSettings[0]
    globsettings= globsettings

    if(process == "increase"){


      GlobalSettingsDB.update("globalsettings",
          {
            $inc: { [workerType]: 1 }
          }
        );

    }else if(process == "decrease"){

      if(globsettings[workerType] > 0){

        GlobalSettingsDB.update("globalsettings",
        {
          $inc: { [workerType]: -1 }
        }
      );

      }
    }
  }


  renderSlider(slider,sliderColour,sliderColour2) {

    if(slider == 'generalWorkerLimit'){

      var title = 'General'

    }else if(slider == 'transcodeWorkerLimit'){

      var title = 'Transcode'


    }else if(slider == 'healthcheckWorkerLimit'){

      var title = 'Health check'

    }
    

    return this.props.globalSettings.map((item, i) => (

      <span className="sliderWidth">


        <center> {title}({item[slider]})</center>
      
        <Slider
          axis="x"
          xstep={1}
          xmin={0}
          xmax={20}
          x={item[slider]}
          onChange={({ x }) => {

            GlobalSettingsDB.upsert('globalsettings',
              {
                $set: {
                  [slider]: x,
                }
              }

            );



          }}

          styles={{
            track: {
              width:'100%',
              opacity: 1,
              backgroundColor: sliderColour2,
            },
            active: {
              opacity: 1,
              backgroundColor: sliderColour,
             
            },
            thumb: {
              width: 25,
              height: 25
            },
            disabled: {
              opacity: 0.5
            }
          }}
        />
      </span>

    ));


  }

  renderStat(stat) {


    var statistics = this.props.statistics


    if (statistics.length == 0) {


      var statDat = <center style={ButtonStyle}><ClipLoader

        sizeUnit={"px"}
        size={10}
        color={'#000000'}
        loading={true}
        style={ButtonStyle}
      /></center>

    } else {
      var statDat = statistics[0][stat]



    }


    return statDat

  }


  renderLowCPUButton() {

   
    return this.props.globalSettings.map((item, i) => (

      <ToggleButton
      thumbStyle={borderRadiusStyle}
      trackStyle={borderRadiusStyle}
      
      value={item.lowCPUPriority} onToggle={() => {

        GlobalSettingsDB.upsert('globalsettings',
          {
            $set: {
              lowCPUPriority: !item.lowCPUPriority,
            }
          }

        );

      }
      } />
    ));
  }

  renderSortBox(type){

    return this.props.globalSettings.map((item, i) => (

      <Checkbox name={type} checked={item.queueSortType == type ? true : false} onChange={this.setSort} />

    ));

  }




  componentDidMount() {

    this.interval = setInterval(() => this.renderWorkers(), 500);


  }


  renderWorkers = () => {



    Meteor.call('getWorkers', (error, result) => {


      var workers = result.map((worker, i) => (

        <Workers
          key={worker._id}
          worker={worker}

        />

      ));

      try {

        render(workers, document.getElementById('allWorkersContainerID'));
      } catch (err) { }

;


    

    });
  }


  renderTable(table, type, mode) {



    var tables = this.props.clientDB



    if (tables.length == 0) {


      var data = [{ _id: 1, file: "Loading...", value: 1 }]

      return data.map((row, i) => (


        <tr align="center">
          <td ><ClipLoader

            sizeUnit={"px"}
            size={25}
            color={'#000000'}
            loading={true}
          /></td>
        </tr>


      ));

    } else {

      var data = tables[0][table]

    }

    if (type == "queue") {


      if (mode == "TranscodeDecisionMaker") {


      return data.map((row, i) => {

        if(row.file_size != undefined){
          var file_size =  parseFloat((row.file_size/1000).toPrecision(4))
        }else{
          var file_size = "-"
        }

        // <td>{row.bumped ? row.bumped.toISOString() : "-"}</td>

       return <tr key={row._id}>
          <td>{i + 1}</td><td>{row.file}</td><td>{row.video_codec_name}</td><td>{row.video_resolution}</td><td>{file_size}</td><td>{ !(row.bumped instanceof Date) ? this.renderBumpButton(row.file):this.renderCancelBumpButton(row.file) }</td>
          </tr>

      }
      );


    }else{

      return data.map((row, i) => {

       return <tr key={row._id}>
          <td>{i + 1}</td><td>{row.file}</td><td>{!(row.bumped instanceof Date) ? this.renderBumpButton(row.file):this.renderCancelBumpButton(row.file) }</td>
          </tr>

      }
      );

    }
    }

    if (type == "success") {

      if (mode == "TranscodeDecisionMaker") {



        return data.map((row, i) => {

          if(row.lastTranscodeDate != undefined){
            var lastTranscodeDate = this.toTime(row.lastTranscodeDate)
          }else{
            var lastTranscodeDate = "-"
          }

          if(row.oldSize != undefined){
            var oldSize =  parseFloat((row.oldSize).toPrecision(4))
          }else{
            var oldSize = "-"
          }

          if(row.newSize != undefined){
            var newSize  =  parseFloat((row.newSize).toPrecision(4))
          }else{
            var newSize = "-"
          }



   

         return <tr key={row._id}>
            <td>{i + 1}</td><td>{lastTranscodeDate}</td><td>{row.file}</td><td>{row.video_codec_name}</td><td>{row.video_resolution}</td><td>{row.TranscodeDecisionMaker}</td><td>{oldSize}</td><td>{newSize}</td><td>{this.renderRedoButton(row.file, mode)}</td><td>{this.renderInfoButton(row.cliLog)}</td>
          </tr>


        });

      } else {

        return data.map((row, i) => {

          if(row.lastHealthCheckDate != undefined){
            var lastHealthCheckDate = this.toTime(row.lastHealthCheckDate)
          }else{
            var lastHealthCheckDate = "-"
          }
  
         return <tr key={row._id}>
            <td>{i + 1}</td><td>{lastHealthCheckDate}</td><td>{row.file}</td><td>{this.renderRedoButton(row.file, mode)}</td><td>{this.renderInfoButton(row.cliLog)}</td>
          </tr>



        });

      }
    }

    if (type == "error") {

      if (mode == "TranscodeDecisionMaker") {

      return data.map((row, i) => {

        if(row.lastTranscodeDate != undefined){
          var lastTranscodeDate = this.toTime(row.lastTranscodeDate)
        }else{
          var lastTranscodeDate = "-"
        }


       return <tr key={row._id}>
          <td>{i + 1}</td><td>{lastTranscodeDate}</td><td>{row.file}</td><td>{this.renderRedoButton(row.file, mode)}</td><td>{this.renderIgnoreButton(row.file, mode)}</td><td>{this.renderInfoButton(row.cliLog)}</td>
        </tr>


      });

      }else{

        return data.map((row, i) => {

          
        if(row.lastHealthCheckDate != undefined){
          var lastHealthCheckDate = this.toTime(row.lastHealthCheckDate)
        }else{
          var lastHealthCheckDate = "-"
        }

         return <tr key={row._id}>
            <td>{i + 1}</td><td>{lastHealthCheckDate}</td><td>{row.file}</td><td>{this.renderRedoButton(row.file, mode)}</td><td>{this.renderIgnoreButton(row.file, mode)}</td><td>{this.renderInfoButton(row.cliLog)}</td>
          </tr>
  
  
      });



      }
    }



  }

  toTime = (d) => {

    var h = (d.getHours() < 10 ? '0' : '') + d.getHours();
    var m = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
    var s = (d.getSeconds() < 10 ? '0' : '') + d.getSeconds();
    var timenow = h + ':' + m + ':' + s;

    return timenow

  }


  renderBumpButton(file) {
    var obj = {
      bumped: new Date(),
    }
    return <ItemButton file={file} obj={obj} symbol={'↑'} type="updateDBAction" />
  }

  renderCancelBumpButton(file) {
    var obj = {
      bumped: false,
    }
    return <ItemButton file={file} obj={obj} symbol={'X'} type="updateDBAction" />
  }

  renderRedoButton(file, mode) {


    var obj = {
      [mode]: "Queued",
      processingStatus: false,
      createdAt: new Date(),
    }


    return <ItemButton file={file} obj={obj} symbol={'↻'} type="updateDBAction" />
  }

  renderIgnoreButton(file, mode) {

    var obj = {
      [mode]: "Ignored",
      processingStatus: false,
      createdAt: new Date(),
    }
    return <ItemButton file={file} obj={obj} symbol={'Ignore'} type="updateDBAction" />


  }

  renderInfoButton(cliLog) {

    try{

    cliLog = cliLog.split("\n")

    cliLog = cliLog.map( row => <p>{row}</p> )

    return <Modal
      trigger={<Button variant="outline-dark" >i</Button>}
      modal
      closeOnDocumentClick
    >
       <div className="frame">
    <div className="scroll"> 
   {cliLog}
      
    </div>
  </div>
    </Modal>

    }catch(err){

      return null

    }

  }

  setSort(event) {

    if (event.target.checked == true) {

      GlobalSettingsDB.upsert(
        "globalsettings",
        {
          $set: {
            queueSortType: event.target.name,
          }
        }
      );


    }
  }


  resetAllStatus(mode) {

    if (confirm('Are you sure you want to re-queue all files?')) {

      Meteor.call('resetAllStatus', 'all', mode, function (error, result) { })

    }
  }




  render() {



    return (


      <span >
        {/* <h1>Td</h1> */}



        <div className="dbStatusContainer">
          <table>
            <tbody>
              <tr>

                <td><b>DB</b></td>
                <td>{'\u00A0'}<b>Poll period</b>:{this.renderStat('DBPollPeriod')}</td>
                <td>{'\u00A0'}<b>Fetch time</b>: {this.renderStat('DBFetchTime')}</td>
                <td>{'\u00A0'}<b>Total</b>: {this.renderStat('DBTotalTime')}</td>
                <td>{'\u00A0'}<b>Backlog</b>: {this.renderStat('DBQueue')}</td>
                <td>{'\u00A0'}<b>Load</b>: {this.renderStat('DBLoadStatus')}</td>

              </tr>


            </tbody>
          </table>
        </div>


{/* 
        <div className="textSizeContainer">

        <select>
    <option>Size</option>

    <option  onClick={() => console.log("here1")}>Test1</option>



    <option  onClick={() => console.log("here2")}>Test2</option>
    </select>

        </div> */}




        <p></p>

        <div className="container">



<center><Modal
      trigger={<Button variant="outline-dark" >i</Button>}
      modal
      closeOnDocumentClick
    >
       <div className="frame">
    <div className="scroll"> 

    <div className="modalText">
 
    <p>Use the sliders to tell Tdarr to start up and maintain the specified number of workers. </p>
    <p>Workers which are toggled 'Off' will finish their current item before closing down.</p>
    <p>If you cancel an item, the worker will move onto the next item in the queue.</p>

    <p></p>
    <p>Workers process newest items first and cycle between your libraries.</p>

    <p>General workers process both transcode and health check items. They prioritise health check </p>
    <p></p>
    <p></p>
    <p></p>

    <p>Important: Workers will not process items unless they are within the scheduled times set in the library settings.</p>
    </div>
      
    </div>
  </div>
    </Modal></center>

        <center>Workers:</center>








<div className="sliderGrid-container">

<div className="sliderGrid-item2">
<Button   variant="outline-dark" onClick={() => this.alterWorkerLimit("decrease","generalWorkerLimit")} >-</Button>
</div>

<div className="sliderGrid-item">
{this.renderSlider('generalWorkerLimit','black','#808080')}
</div>
<div className="sliderGrid-item3">
<Button   variant="outline-dark" onClick={() => this.alterWorkerLimit("increase","generalWorkerLimit")} >+</Button>
</div>


<div className="sliderGrid-item2">
<Button   variant="outline-dark" onClick={() => this.alterWorkerLimit("decrease","transcodeWorkerLimit")} >-</Button>
</div>

<div className="sliderGrid-item">
{this.renderSlider('transcodeWorkerLimit','#66ccff','#B3E6FF')}
</div>

<div className="sliderGrid-item3">
<Button   variant="outline-dark" onClick={() => this.alterWorkerLimit("increase","transcodeWorkerLimit")} >+</Button>
</div>


<div className="sliderGrid-item2">
<Button   variant="outline-dark" onClick={() => this.alterWorkerLimit("decrease","healthcheckWorkerLimit")} >-</Button>
</div>

<div className="sliderGrid-item">
{this.renderSlider('healthcheckWorkerLimit','#4CAF50','#A6D7A8')}
</div>

<div className="sliderGrid-item3">
<Button   variant="outline-dark" onClick={() => this.alterWorkerLimit("increase","healthcheckWorkerLimit")} >+</Button>
</div>


</div>



          <p></p>


          
          

          <center>

          <div style={ButtonStyle} className="workerButtoncontainer">






            <Button variant="outline-danger" onClick={() => {

              if (confirm('Are you sure you want to cancel all workers?')) {


                Meteor.call('getWorkers', function (error, result) {

                  var workers = result

                  for (var i = 0; i < workers.length; i++) {

                    Meteor.call('killWorker', workers[i]._id, function (error, result) { })
                  }

                });


              }
            }
            } >Cancel all workers</Button>

{'\u00A0'}{'\u00A0'}{'\u00A0'}{'\u00A0'}

            <div style={ButtonStyle}>
              <span >Low CPU priority:<div style={ButtonStyle}>

                {this.renderLowCPUButton()}


              </div>
              </span>
            </div>

          </div>
          </center>


          <p></p>
          <br/>
          <br/>
          <br/>

          <div className="allWorkersContainer" id="allWorkersContainerID">


          </div>

        </div>
        <p></p>
    <p></p>
    <p></p>

        <Modal
      trigger={<Button variant="outline-dark" >i</Button>}
      modal
      closeOnDocumentClick
    >
       <div className="frame">
    <div className="scroll"> 

    <div className="modalText">
 
    <p>All newly scanned files will be placed in the transcode and health check queues.</p>
    
    <p>Files in the queues will be sent to available workers.</p>

    <p>For transcodes, if files already meet the codec (etc) requirements they will be marked as 'Not required' in 'Transcode: Success/Not required' tab.</p>
    
    
    <p>If files don't meet the requirements they will be transcoded. If transcoding is successful files will be marked as 'Transcode success' in the  'Transcode: Success/Not required' tab.</p>
    <p></p>

    
    <p>If transcoding fails or is cancelled then files will be marked accordingly in the 'Transcode: Error/Cancelled' tab.</p>


    <p></p>
    <p></p>


    <p><b>The end goal of Tdarr is to be able to run it on your library and all items come out as 'Transcode:Not required', meaning nothing needed to be transcoded/remuxed etc.</b></p>


    </div>
      
    </div>
  </div>
    </Modal>




<p>Sort queue by: </p>
                  <p>Oldest:
{this.renderSortBox('sortDateOldest')}
                    Newest:
{this.renderSortBox('sortDateNewest')}
              
                Smallest:
{this.renderSortBox('sortSizeSmallest')}
                    Largest:
{this.renderSortBox('sortSizeLargest')}
                  </p>

            

        <Tabs>
    <TabList>
      <Tab>Transcode queue ({this.renderStat('table1Count')})</Tab>
      <Tab>Transcode: Success/Not required ({this.renderStat('table2Count')})</Tab>
      <Tab>Transcode: Error/Cancelled ({this.renderStat('table3Count')})</Tab>



      <Tab>Health check queue ({this.renderStat('table4Count')})</Tab>
      <Tab>Health check: Healthy ({this.renderStat('table5Count')})</Tab>
      <Tab>Health check: Error/Cancelled ({this.renderStat('table6Count')})</Tab>

    </TabList>

    <TabPanel>
      

    <table className="itemTable">   <tbody>
              <tr>
                <th>No.</th>
                <th>File</th>
                <th>Codec</th>
                <th>Resolution</th>
                <th>Size (GB)</th>
                <th>Bump</th>

              </tr>
              {this.renderTable('table1', 'queue','TranscodeDecisionMaker')}
            </tbody></table>
   



    </TabPanel>
    <TabPanel>
    <table className="itemTable"><tbody>
              <tr>
                <th>No.</th>
                <th>Time</th>
                <th>File</th>
                <th>Codec</th>
                <th>Resolution</th>
                <th>Transcode</th>
                <th>Old size (GB)</th>
                <th>New size (GB)</th>
                <th><Button variant="outline-dark" onClick={() => this.resetAllStatus('TranscodeDecisionMaker')} >Re-queue</Button></th>
                <th>Info</th>


              </tr>
              {this.renderTable('table2', 'success', 'TranscodeDecisionMaker')}

            </tbody></table>
    </TabPanel>

    <TabPanel>

    <table className="itemTable">   <tbody>
              <tr>
                <th>No.</th>
                <th>Time</th>
                <th>File</th>
                <th><Button variant="outline-dark" onClick={() => this.resetAllStatus('TranscodeDecisionMaker')} >Re-queue</Button></th>
                <th>Ignore</th>
                <th>Info</th>


              </tr>


              {this.renderTable('table3', 'error', 'TranscodeDecisionMaker')}


            </tbody></table>


    </TabPanel>

    <TabPanel>

    <table className="itemTable">   <tbody>
              <tr>
                <th>No.</th>
                <th>File</th>
                <th>Bump</th>

              </tr>
              {this.renderTable('table4', 'queue','HealthCheck')}

            </tbody></table>


    </TabPanel>

    <TabPanel>

    <table className="itemTable">   <tbody>
              <tr>
                <th>No.</th>
                <th>Time</th>
                <th>File</th>
                <th><Button   variant="outline-dark" onClick={() => this.resetAllStatus('HealthCheck')} >Re-queue</Button></th>
                <th>Info</th>
              </tr>



              {this.renderTable('table5', 'success', 'HealthCheck')}


            </tbody></table>


    </TabPanel>

    <TabPanel>
    <table className="itemTable">   <tbody>
              <tr>
                <th>No.</th>
                <th>Time</th>
                <th>File</th>
                <th><Button   variant="outline-dark" onClick={() => this.resetAllStatus('HealthCheck')} >Re-queue</Button></th>
                <th>Ignore</th>
                <th>Info</th>


              </tr>

            


              {this.renderTable('table6', 'error', 'HealthCheck')}

            </tbody></table>

    </TabPanel>
  </Tabs> 

      </span>
    );
  }
}

export default withTracker(() => {

  Meteor.subscribe('GlobalSettingsDB');
  Meteor.subscribe('ClientDB');
  Meteor.subscribe('StatisticsDB');


  return {


    globalSettings: GlobalSettingsDB.find({}, {}).fetch(),

    clientDB: ClientDB.find({}).fetch(),
    statistics: StatisticsDB.find({}).fetch(),


  };
})(App);
