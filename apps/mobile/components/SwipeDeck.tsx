import { View, Text, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';

export default function SwipeDeck({ item, onSwipe, onUndo }:{ item:any, onSwipe:(d:'left'|'right'|'down')=>void, onUndo:()=>void }) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const gone = useSharedValue(false);

  const style = useAnimatedStyle(()=> ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { rotate: `${x.value/20}deg` }],
    opacity: gone.value ? withTiming(0) : 1,
  }));

  function finish(dir:'left'|'right'|'down') {
    gone.value = true;
    runOnJS(onSwipe)(dir);
    x.value = 0; y.value = 0; gone.value = false;
  }

  return (
    <View style={{ flex:1, justifyContent:'center' }}>
      <PanGestureHandler onGestureEvent={({nativeEvent})=>{ x.value = nativeEvent.translationX; y.value = nativeEvent.translationY; }}
        onEnded={({nativeEvent})=>{
          if (nativeEvent.translationX > 120) finish('right');
          else if (nativeEvent.translationX < -120) finish('left');
          else if (nativeEvent.translationY > 120) finish('down');
          else { x.value = withSpring(0); y.value = withSpring(0); }
        }}>
        <Animated.View style={[{ padding:20, backgroundColor:'#151521', borderRadius:20, shadowColor:'#000', shadowOpacity:0.3, shadowRadius:12 }, style]}>
          <Text style={{ color:'#fff', fontSize:18, fontWeight:'700', marginBottom:6 }}>{item.title}</Text>
          <Text style={{ color:'#C8C8D0' }}>{item.description}</Text>
          <Text style={{ color:'#8FA3FF', marginTop:8 }}>Swipe ➜ Yes • Swipe ◄ No • Swipe ▼ Maybe</Text>
          <Pressable onPress={onUndo} style={{ marginTop:10, alignSelf:'flex-start' }}>
            <Text style={{ color:'#8FA3FF' }}>Undo (two-tap)</Text>
          </Pressable>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}