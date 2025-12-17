"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
// import Link from "next/link";
// import Image from "next/image";
import { View, Text, Button, Alert } from 'react-native';
import { useApp } from '../../context/AppContext';
import { usePathname } from "next/navigation";
import axios from "axios";
import NoneForm from "./NoneForm"
// import History  from "./History";
import ModelForm from "./Forms"

export default function MainPrompt({ModelPageData, ModelFormData, onParanetMsg, ParentSideMenuState, ParenHandleSideBar}) {

  const { isDarkMode, language, translations } = useApp();

  const renderPage = ()=>{
    
    //  console.log("in main" , ModelPageData)
    
    if(ModelFormData.length == 0 ){
        return  <NoneForm 
            ModelPageData={ModelPageData} 
            ParentSideMenuState={ParentSideMenuState} 
            ParenHandleSideBar={ParenHandleSideBar}  
            />
    }else{
     
        return <ModelForm  
              ModelFormData={ModelFormData} 
              ModelPageData={ModelPageData} 
              ParentSideMenuState={ParentSideMenuState} 
              ParenHandleSideBar={ParenHandleSideBar} 
            />
    }
  }

  return (
    renderPage()
  );
}