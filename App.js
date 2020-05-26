import axios from 'axios';
import React, { useState,useEffect  } from 'react';
import {
  StyleSheet,
  Dimensions ,
  SafeAreaView ,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  Accelerometer,
  Gyroscope,
  DeviceMotion 
} from 'expo-sensors';
import * as firebaseApi from './firebaseApi'
import { YellowBox } from 'react-native';
YellowBox.ignoreWarnings(['Setting a timer']);


export default function App() {
    
    
    const axisLabels = ["X", "Y", "Z"]
    let subscribeToGyro
    let subscribeToAcc
    let deviceMotionSub

    const [ipv4Address , setIpv4Address] = useState("192.168.0.118")
    const [portNum , setPortNum] = useState("8080")
    const [displayGyro , setDisplayGyro] = useState(["0","0","0"])
    const [displayAcc , setDisplayAcc] = useState(["0","0","0"])
    const [displayTime , setDisplayTime] = useState(0)
    const [numLoop, setNumLoop] = useState(0)
    const [numLoopAcc, setNumLoopAcc] = useState(0)
    const numLoopRef = React.useRef(numLoop)
    const setNumLoopRef = data => {
        numLoopRef.current = data;
        setNumLoop(data);
    };
    const numLoopAccRef = React.useRef(numLoopAcc)
    const setNumLoopAccRef = data => {
        numLoopAccRef.current = data;
        setNumLoopAcc(data);
    };
    const [interval , setInterval] = useState("1000")
    const [sendToServerStatus , setSendToServerStatus]=useState(false)
    const [sendToIpv4Status , setSendToIpv4Status] = useState(false)
    const [sendToFirestoreStatus, setSendToFirestoreStatus] = useState(true)

    // const [androidGyroDataStore , setAndroidGyroDataStore] = useState([])
    // const androidGyroDataStoreRef = React.useRef(androidGyroDataStore)
    // const setAndroidGyroDataStoreRef = data => {
    //     androidGyroDataStoreRef.current = data;
    //     setAndroidGyroDataStore(data);
    // };
    // const [androidAccDataStore , setAndroidAccDataStore] = useState([])
    // const androidAccDataStoreRef = React.useRef(androidAccDataStore)
    // const setAndroidAccDataStoreRef = data => {
    //     androidAccDataStoreRef.current = data;
    //     setAndroidAccDataStore(data);
    // };
    const resetApp = () => {
        setIpv4Address("192.168.0.118")
        setPortNum("8080")
        setDisplayTime(0)
        setNumLoopRef(0)
        setNumLoopAccRef(0)
        setSendToServerStatus(false)
        setInterval("1000")
        // setAndroidGyroDataStoreRef([])
        // setAndroidAccDataStoreRef([])
        setSendToFirestoreStatus(true)
        setSendToIpv4Status(false)
        
    }
    const changeIpv4Address = (text) => {
        setIpv4Address(text)
    }
    const changePortNum = (text) => {
        setPortNum(text)
    }
    const changeSendToIpv4Status = () => {
        if(sendToIpv4Status){
            setSendToIpv4Status(false)
        }else{
            setSendToIpv4Status(true)
        }
    }
    const changeSendToFirestoreStatus = () => {
        if(sendToFirestoreStatus){
            setSendToFirestoreStatus(false)
        }else{
            setSendToFirestoreStatus(true)
        }
    }
    const changeSentToServerStatus = ()=>{
        if (sendToServerStatus === true){
            setSendToServerStatus(false)
            // if(Platform.OS === "android" && sendToFirestoreStatus){
            //     console.log(androidAccDataStore)
            //     console.log(androidGyroDataStore)
            //     firebaseApi.sendPacketToFirestore({
            //         accelerometer: androidAccDataStore,
            //         gyroscope: androidGyroDataStore
            //     })
            // }
        }else{
            setSendToServerStatus(true)
        }
    }

    const changeInterval = (num) => {
        unsubscribeToSensors()
        setInterval(num)
        // if(num.length>=3){
        //     let intInterval = parseInt(interval)
        //     subscribeToSensors()
        // }
    }
    const unsubscribeToSensors = () => {


        deviceMotionSub && deviceMotionSub.remove()

        // subscribeToGyro && Gyroscope.removeAllListeners()
        // subscribeToAcc && Accelerometer.removeAllListeners()
        // subscribeToGyro = null
        // subscribeToAcc = null
      };
    const sendToIpv4 = (x) => {
    let promise = axios.post(`http://${ipv4Address}:${portNum}`, {
        data: x,
        headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            "Access-Control-Allow-Origin": "*",
        }
    })
    return promise
    }
    const cacheOrSendToFirestore = ({dataType,dataX,dataY,dataZ,dataTime}) => {
        //Platform.OS === "ios" &&
        if( sendToFirestoreStatus ){
            firebaseApi.sendToFirebase(dataType,dataX,dataY,dataZ,dataTime)
        }
        // if(Platform.OS === "android" && dataType === "Accelerometer" && sendToFirestoreStatus){
        //     androidAccDataStoreRef.current.push({dataX,dataY,dataZ,dataTime})
        //     setAndroidAccDataStoreRef(androidAccDataStoreRef.current)
        // }
        // if(Platform.OS === "android" && dataType === "Gyroscope" && sendToFirestoreStatus){
        //     androidGyroDataStoreRef.current.push({dataX,dataY,dataZ,dataTime})
        //     setAndroidGyroDataStoreRef(androidGyroDataStoreRef.current)
        // }
        
        return
    }
    const subscribeToSensors = ()=>{
        DeviceMotion.setUpdateInterval(parseInt(interval))
        deviceMotionSub = DeviceMotion.addListener((event)=>{
            let{
                acceleration,
                accelerationIncludingGravity,
                rotation,
                rotationRate,
                orientation  
            } = event
            let dp = 3
            if(sendToServerStatus === true){
                let time = (numLoopRef.current) * interval * 10**(-3)
                let gyroData = {
                    dataType: "Gyroscope",
                    dataX:  rotationRate.beta,
                    dataY: rotationRate.gamma,
                    dataZ: rotationRate.alpha,
                    dataTime: time
                }
                let accData = {
                    dataType:"Accelerometer",
                    dataX: accelerationIncludingGravity.x,
                    dataY: accelerationIncludingGravity.y,
                    dataZ: accelerationIncludingGravity.z,
                    dataTime: time
                }
                if(sendToFirestoreStatus){
                    cacheOrSendToFirestore(gyroData)
                    cacheOrSendToFirestore(accData)
                }
                if(sendToIpv4Status){
                    sendToIpv4(gyroData)
                    .then( (response) =>{
                        sendToIpv4(accData)
                    })
                    .catch((e) =>{
                        console.log(e.message)
                    });
                }
                setNumLoopRef(numLoopRef.current+1)
                setDisplayTime(time)
            }else{
                setDisplayAcc([accelerationIncludingGravity.x.toFixed(dp),accelerationIncludingGravity.y.toFixed(dp),accelerationIncludingGravity.z.toFixed(dp)])
                setDisplayGyro([rotationRate.beta.toFixed(dp),rotationRate.gamma.toFixed(dp),rotationRate.alpha.toFixed(dp)])
            }
        })


        // Gyroscope.setUpdateInterval(parseInt(interval))
        // Accelerometer.setUpdateInterval(parseInt(interval))
        // let dp = 5
        // subscribeToGyro = Gyroscope.addListener(gyroscopeData => {
        //     if( sendToServerStatus === true){
        //         let time = (numLoopRef.current) * interval * 10**(-3)
        //         let x = {
        //             dataType: "Gyroscope",
        //             dataX: gyroscopeData.x.toFixed(dp),
        //             dataY: gyroscopeData.y.toFixed(dp),
        //             dataZ: gyroscopeData.z.toFixed(dp),
        //             dataTime: time
        //           }
        //         if(sendToIpv4Status){
        //             sendToIpv4(x)
        //             .then( (response) =>{
        //                 if(sendToFirestoreStatus){
        //                     cacheOrSendToFirestore(x)
        //                 }
        //                 setNumLoopRef(numLoopRef.current+1)
        //                 setDisplayTime(time)
        //             })
        //             .catch((e) =>{
        //                 console.log(e.message)
        //             });
        //         }else{
        //             if(sendToFirestoreStatus){
        //                 cacheOrSendToFirestore(x)
        //             }
        //             setNumLoopRef(numLoopRef.current+1)
        //             setDisplayTime(time)
        //         }
                
        //     }
        //     setDisplayGyro([gyroscopeData.x.toFixed(dp),gyroscopeData.y.toFixed(dp),gyroscopeData.z.toFixed(dp)])
        // })
        // subscribeToAcc = Accelerometer.addListener(AccelerometerData => {
        //     if( sendToServerStatus === true){
        //         let time = (numLoopAccRef.current) * interval * 10**(-3)
        //         let x = {
        //             dataType: "Accelerometer",
        //             dataX: AccelerometerData.x.toFixed(dp),
        //             dataY: AccelerometerData.y.toFixed(dp),
        //             dataZ: AccelerometerData.z.toFixed(dp),
        //             dataTime: time
        //           }
        //         if(sendToIpv4Status){
        //             sendToIpv4(x)
        //             .then( (response) =>{
        //                 cacheOrSendToFirestore(x)
        //                 setNumLoopAccRef(numLoopAccRef.current+1)
        //             })
        //             .catch((e)=>{
        //                 console.log(e.message)
        //             })
        //         }else{
        //             cacheOrSendToFirestore(x)
        //             setNumLoopAccRef(numLoopAccRef.current+1)
        //         }
                
        //     }
        //     setDisplayAcc([AccelerometerData.x.toFixed(dp),AccelerometerData.y.toFixed(dp),AccelerometerData.z.toFixed(dp)])
        // })
    }

    useEffect(()=>{
        subscribeToSensors()
        return()=>{unsubscribeToSensors()}
    },[])

    useEffect(()=>{
        subscribeToSensors()
        return()=>{unsubscribeToSensors()}
    },[sendToServerStatus])

    useEffect(()=>{
        if(interval.length >= 3){
            subscribeToSensors()
            return()=>{unsubscribeToSensors()}
        }
        return
    },[interval])
    

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            width: Dimensions.get('window').width,
            height: Dimensions.get('window').height,
            flexDirection: "column",
            justifyContent:"flex-start",
            alignContent:"center",
            paddingTop:20
        },
        wrapperRow:{
            flexDirection: 'row',
            justifyContent:'center',
            alignContent:'center',
            alignItems:"center",
            backgroundColor:'yellow',
            height:"10%",
            paddingBottom: 5,
            paddingLeft:20,
            paddingRight: 5,
            borderWidth: 1,
            borderColor :"black"
        },
        textInput:{
            fontSize:30,
            width:"100%",
            textAlign:"center"
        },
        sensorDisplayRow:{
            flexDirection: 'row',
            justifyContent:'flex-start',
            alignContent:'flex-start',
            backgroundColor:'grey',
            paddingTop:10,
            paddingBottom:10
        },
        sensorDisplayColumn:{
            flexDirection:"column",
            justifyContent:"space-around",
            alignContent:"space-between",
        },
        displayRow:{
            flexDirection:"row",
            justifyContent:"space-between",
            alignContent:"flex-start",
            paddingLeft:10
        },
        displayText:{
            fontSize:20,
        },
        intervalRow:{
            flexDirection:"row",
            justifyContent:"space-around",
            alignItems:"flex-start"
        },
        buttonRow:{
            flexDirection:"row",
            justifyContent:"space-around",
            alignContent:"center",
            height:"30%"
        },
        button:{
            textAlign:"center",
            height: 10,
            height: "30%", 
            width: "40%",
            marginTop: 30,
            backgroundColor:"grey",
            flexDirection:"column",
            justifyContent:"center",
            alignItems:"center"
        },
        startButton:{
            textAlign:"center",
            height: 10,
            height: "30%", 
            width: "40%",
            marginTop: 30,
            backgroundColor:"grey",
            flexDirection:"column",
            justifyContent:"center",
            alignItems:"center",
            backgroundColor: sendToServerStatus ? "red" : "green"
        },
        span:{
            height:"5%"
        }
        
    })

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.wrapperRow}>
            <TextInput
                keyboardType="numeric"
                returnKeyType='done'
                style={styles.textInput}
                value={ipv4Address}
                onChangeText={changeIpv4Address}
            />
        </View>
        <View style={styles.wrapperRow}>
            <TextInput
                returnKeyType='done'
                keyboardType="numeric"
                style={styles.textInput}
                value={portNum}
                onChangeText={changePortNum}
            />
        </View>
        <View style={styles.wrapperRow}>
            <TouchableOpacity style={styles.intervalRow}>
                <Text style={styles.textInput} onPress={changeSendToIpv4Status}>{`IPV4: ${sendToIpv4Status ? "YES" : "NO"}`}</Text>
            </TouchableOpacity>
        </View>
        <View style={styles.wrapperRow}>
            <TouchableOpacity style={styles.intervalRow}>
                <Text style={styles.textInput} onPress={changeSendToFirestoreStatus}>{`FIRESTORE: ${sendToFirestoreStatus ? "YES" : "NO"}`}</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.sensorDisplayRow}>
            <View style={styles.sensorDisplayColumn}>
                {
                    displayGyro.map((data,i)=>
                    <View style={styles.displayRow} key={20+i} >
                        <Text style={styles.displayText}>{`Gyro - ${axisLabels[i]}:   ${data}`}</Text>
                    </View>
                    )
                }
                <View style={styles.span}></View>
                {
                    displayAcc.map((data,i)=>
                    <View style={styles.displayRow} key={50+i} >
                        <Text style={styles.displayText}>{`Accel - ${axisLabels[i]}:   ${data}`}</Text>
                    </View>
                    )
                }
                <View style={styles.displayRow}>
                    <Text style={styles.displayText} >{`Time Elapsed:   ${displayTime.toFixed(2)}`}</Text>
                </View>
            </View>
        </View>
        <View style={styles.intervalRow}>
            <Text style={styles.textInput}>{`Interval(ms): `}</Text> 
            <TextInput keyboardType="numeric" returnKeyType='done' style={styles.textInput} onChangeText={changeInterval} value={`${interval}`}/>
        </View>
        <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.startButton}>
                <Text style={styles.textInput} onPress={changeSentToServerStatus}>{sendToServerStatus ? "STOP" : "START"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button}>
                <Text onPress={resetApp} style={styles.textInput}>CLEAR</Text>
            </TouchableOpacity>
        </View>
    </SafeAreaView>
    
  );
  
}

