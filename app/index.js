import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const pad = (n, size = 2) => String(n).padStart(size, '0');

function formatTime(ms, includeHours = true) {
  const totalCentiseconds = Math.floor(ms / 10);
  const centiseconds = totalCentiseconds % 100;
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  return includeHours
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

export default function StopwatchScreen() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState([]);
  const startedAt = useRef(null);
  const accumulated = useRef(0);

  useEffect(() => {
    if (!running) return undefined;
    const tick = () => setElapsed(accumulated.current + (Date.now() - startedAt.current));
    tick();
    const timer = setInterval(tick, 31);
    return () => clearInterval(timer);
  }, [running]);

  const start = () => {
    startedAt.current = Date.now();
    setRunning(true);
  };

  const pause = () => {
    accumulated.current += Date.now() - startedAt.current;
    setElapsed(accumulated.current);
    setRunning(false);
  };

  const reset = () => {
    setRunning(false);
    accumulated.current = 0;
    startedAt.current = null;
    setElapsed(0);
    setLaps([]);
  };

  const addLap = () => {
    if (!running && elapsed === 0) return;
    const previous = laps.length ? laps[0].total : 0;
    const lap = { id: String(Date.now()), total: elapsed, split: elapsed - previous, number: laps.length + 1 };
    setLaps(current => [lap, ...current]);
  };

  const best = laps.length ? Math.min(...laps.map(l => l.split)) : null;
  const worst = laps.length ? Math.max(...laps.map(l => l.split)) : null;

  const renderLap = ({ item }) => {
    let tone = '#E8EDF7';
    let tag = '';
    if (laps.length > 1 && item.split === best) { tone = '#45D6A5'; tag = 'الأفضل'; }
    else if (laps.length > 1 && item.split === worst) { tone = '#FF7B7B'; tag = 'الأبطأ'; }
    return (
      <View style={styles.lapRow}>
        <View style={styles.lapLeft}>
          <Text style={styles.lapNumber}>لفة {pad(item.number)}</Text>
          {!!tag && <Text style={[styles.lapTag, { color: tone }]}>{tag}</Text>}
        </View>
        <Text style={styles.lapSplit}>{`+${formatTime(item.split)}`}</Text>
        <Text style={styles.lapTotal}>{formatTime(item.total)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>TIMEKEEPER</Text>
            <Text style={styles.title}>ساعة التوقيت</Text>
          </View>
          <View style={styles.iconBadge}>
            <Ionicons name="stopwatch-outline" size={23} color="#8B9BFF" />
          </View>
        </View>

        <View style={styles.timerCard}>
          <View style={styles.timerTop}>
            <View style={[styles.statusDot, running && styles.statusDotActive]} />
            <Text style={styles.statusText}>{running ? 'قيد التشغيل' : elapsed > 0 ? 'متوقفة مؤقتاً' : 'جاهزة للبدء'}</Text>
          </View>
          <View style={styles.timerCenter}>
            <Text style={styles.timerDigits}>{formatTime(elapsed)}</Text>
            <Text style={styles.centiseconds}>.{pad(Math.floor(elapsed / 10) % 100)}</Text>
          </View>
          <View style={styles.timerBottom}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{pad(laps.length)}</Text>
              <Text style={styles.metricLabel}>عدد اللفات</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{laps.length ? formatTime(laps[0].split, false) : '--:--'}</Text>
              <Text style={styles.metricLabel}>آخر لفة</Text>
            </View>
          </View>
        </View>

        <View style={styles.controls}>
          <Pressable onPress={running || elapsed > 0 ? (running ? pause : reset) : reset}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Ionicons name={running ? 'pause' : 'refresh'} size={21} color="#D9E0F0" />
            <Text style={styles.secondaryText}>{running ? 'إيقاف مؤقت' : 'إعادة ضبط'}</Text>
          </Pressable>
          <Pressable onPress={running ? addLap : start}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Ionicons name={running ? 'flag-outline' : 'play'} size={21} color="#08111A" />
            <Text style={styles.primaryText}>{running ? 'لفة جديدة' : 'ابدأ'}</Text>
          </Pressable>
        </View>

        <View style={styles.lapsHeader}>
          <View>
            <Text style={styles.sectionTitle}>سجل اللفات</Text>
            <Text style={styles.sectionSubtitle}>تابع أداءك في كل جولة</Text>
          </View>
          <Text style={styles.lapCount}>{laps.length} LAPS</Text>
        </View>

        {laps.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}><Ionicons name="flag-outline" size={25} color="#66728D" /></View>
            <Text style={styles.emptyTitle}>لا توجد لفات بعد</Text>
            <Text style={styles.emptyText}>ابدأ التوقيت ثم اضغط «لفة جديدة» لتسجيل أول لفة.</Text>
          </View>
        ) : (
          <FlatList
            data={laps}
            keyExtractor={item => item.id}
            renderItem={renderLap}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.lapList}
          />
        )}

        <Text style={styles.footer}>دقيق • بسيط • في الوقت المناسب</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#090D18' },
  container: { flex: 1, paddingHorizontal: 22, paddingTop: Platform.OS === 'android' ? 10 : 6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  eyebrow: { color: '#7180A4', fontSize: 10, letterSpacing: 3, fontWeight: '800', marginBottom: 6 },
  title: { color: '#F3F5FC', fontSize: 25, fontWeight: '800' },
  iconBadge: { width: 46, height: 46, borderRadius: 15, backgroundColor: '#171F35', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#283452' },
  timerCard: { backgroundColor: '#11182A', borderRadius: 28, borderWidth: 1, borderColor: '#202B45', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 18, minHeight: 275 },
  timerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#71809D' },
  statusDotActive: { backgroundColor: '#45D6A5' },
  statusText: { color: '#91A0BE', fontSize: 12, fontWeight: '600' },
  timerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 28 },
  timerDigits: { color: '#F5F7FF', fontSize: 47, fontWeight: '300', letterSpacing: 1, fontVariant: ['tabular-nums'] },
  centiseconds: { color: '#8795FF', fontSize: 23, fontWeight: '600', marginTop: 16, fontVariant: ['tabular-nums'] },
  timerBottom: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#25304A', paddingTop: 15 },
  metric: { flex: 1, alignItems: 'center' },
  metricValue: { color: '#E8EDFA', fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
  metricLabel: { color: '#7583A2', fontSize: 11, marginTop: 4 },
  metricDivider: { width: 1, height: 30, backgroundColor: '#29334C' },
  controls: { flexDirection: 'row', gap: 12, marginTop: 18, marginBottom: 27 },
  secondaryButton: { flex: 1, height: 58, borderRadius: 17, backgroundColor: '#1A2338', borderWidth: 1, borderColor: '#2A3653', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  secondaryText: { color: '#D9E0F0', fontSize: 14, fontWeight: '700' },
  primaryButton: { flex: 1, height: 58, borderRadius: 17, backgroundColor: '#8B9BFF', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  primaryText: { color: '#08111A', fontSize: 15, fontWeight: '900' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  lapsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#F0F3FC', fontSize: 17, fontWeight: '800' },
  sectionSubtitle: { color: '#74819D', fontSize: 11, marginTop: 4 },
  lapCount: { color: '#7F8DB0', fontSize: 10, letterSpacing: 1.5, fontWeight: '800' },
  emptyState: { flex: 1, minHeight: 130, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  emptyIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#151E32', alignItems: 'center', justifyContent: 'center', marginBottom: 11 },
  emptyTitle: { color: '#DCE2F2', fontSize: 14, fontWeight: '700' },
  emptyText: { color: '#6F7C98', fontSize: 11, textAlign: 'center', lineHeight: 19, marginTop: 5 },
  lapList: { paddingBottom: 10 },
  lapRow: { minHeight: 57, borderBottomWidth: 1, borderBottomColor: '#1B2438', flexDirection: 'row', alignItems: 'center' },
  lapLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  lapNumber: { color: '#C8D0E3', fontSize: 13, fontWeight: '700' },
  lapTag: { fontSize: 9, fontWeight: '800' },
  lapSplit: { color: '#9AA7C2', fontSize: 12, marginRight: 18, fontVariant: ['tabular-nums'] },
  lapTotal: { color: '#F0F3FC', fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  footer: { color: '#46516B', textAlign: 'center', fontSize: 10, paddingVertical: 12, letterSpacing: 1 }
});
