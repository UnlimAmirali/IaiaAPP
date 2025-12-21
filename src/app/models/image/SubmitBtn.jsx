import React, { useEffect, useRef } from "react";
import { TouchableOpacity, Text, View, Animated, StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";

export default function GlowButton({ isLoading=false, onPress, children="ساختن" }) {

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: isLoading ? 2500 : 1200, // سریع‌تر مثل حالت loading
        useNativeDriver: true,
      })
    ).start();
  }, [isLoading]);

const translateX = anim.interpolate({
  inputRange: [0, 1],
  outputRange: [-430, 0]   // مقدار زیادتر
});

  return (
    <View style={styles.root}>
      
      <View style={styles.borderWrapper}>
        
        <Animated.View
          style={[
            styles.gradientAnimated,
            { transform: [{ translateX }] }
          ]}
        >
          <LinearGradient
            colors={[
              "#ff0000","#ff7300","#fffb00",
              "#48ff00","#00ffd5","#002bff",
              "#7a00ff","#ff00c8","#ff0000"
            ]}
            start={{x:0,y:0}}
            end={{x:1,y:0}}
            style={styles.gradient}
          />
        </Animated.View>

      </View>

      <TouchableOpacity
        disabled={isLoading}
        style={[styles.btn, isLoading && styles.disabledBtn]}
        onPress={onPress}
      >
        <Text style={styles.text}>
          {isLoading ? "در حال پردازش..." : children}
        </Text>
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  root:{
    width:"100%",
    position:"absolute",
    // bottom:30,
    justifyContent:"center",
    alignItems:"center",
  },
  btn:{
    width:220,
    height:50,
    backgroundColor:"#111",
    borderRadius:10,
    justifyContent:"center",
    alignItems:"center",
    zIndex:3
  },
  disabledBtn:{
    backgroundColor:"#333"
  },
  text:{
    color:"#fff",
    fontSize:16
  },
  borderWrapper:{
    position:"absolute",
    width:230,
    height:55,
    borderRadius:12,
    overflow:"hidden",
    filter: "blur(4px)" // برای WEB RN، روی موبایل حذف میشه
  },
  gradientAnimated:{
    position:"absolute",
    width:430, // بزرگتر تا حرکت دیده شود
    height:60
  },
  gradient:{
    width:"100%",
    height:"100%",
  }
});
