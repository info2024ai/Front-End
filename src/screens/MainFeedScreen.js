import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  View,
  Text,
} from "react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";

import useAuthStore from "../store/authStore";
import useFeedStore from "../store/feedStore";
import FeedItem from "../components/feed/FeedItem";
import Colors from "../constants/colors";
import MainHeader from "../components/navigation/MainHeader";
import AddFeedIcon from "../../assets/images/AddFeed.png";

const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyTitle}>아직 피드가 없어요</Text>
    <Text style={styles.emptyDescription}>
      새로운 피드를 작성하고 친구들과 공유해보세요!
    </Text>
  </View>
);

const MainFeedScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [isCommentVisible, setIsCommentVisible] = useState(false);
  const [selectedFeedId, setSelectedFeedId] = useState(null);

  const flatListRef = useRef(null);
  const feedListRef = useRef(null);
  const { feedId, commentId } = route.params || {};

  const { feeds, filteredFeeds, setSelectedGroup, error, isLoading } =
    useFeedStore();
  const getAccessToken = useAuthStore((state) => state.getAccessToken);
  const [currentGroupId, setCurrentGroupId] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  // 피드 로딩 함수
  const loadFeeds = useCallback(
    async (groupId = "all") => {
      try {
        console.log("[MainFeedScreen] Loading feeds for group:", groupId);
        const token = getAccessToken();
        if (!token) {
          console.log("[MainFeedScreen] No token found, navigating to login");
          navigation.navigate("Login");
          return;
        }
        await setSelectedGroup(groupId);
        console.log("[MainFeedScreen] Feeds loaded successfully");
      } catch (error) {
        console.error("[MainFeedScreen] Feed loading error:", error);
        Alert.alert("오류", "피드를 불러오는데 실패했습니다.");
      }
    },
    [getAccessToken, navigation, setSelectedGroup]
  );

  // 초기 로딩
  useEffect(() => {
    console.log("[MainFeedScreen] Initial feed loading");
    loadFeeds("all");
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // 화면에 포커스될 때마다 실행
  useFocusEffect(
    useCallback(() => {
      console.log("[MainFeedScreen] Screen focused");
      const newGroupId = route.params?.selectedGroupId || currentGroupId;

      if (newGroupId !== currentGroupId) {
        console.log("[MainFeedScreen] Group changed, loading new feeds");
        setCurrentGroupId(newGroupId);
        loadFeeds(newGroupId);
      }

      // 선택된 피드가 있으면 스크롤
      if (route.params?.selectedFeedId && filteredFeeds.length > 0) {
        const selectedIndex = filteredFeeds.findIndex(
          (feed) => feed.feedId === route.params.selectedFeedId
        );

        if (selectedIndex !== -1) {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: selectedIndex,
              animated: true,
              viewPosition: 0,
            });
          }, 500);
        }
      }
    }, [route.params, currentGroupId, loadFeeds])
  );

  //선택된 코멘트로 이동
  useEffect(() => {
    if (feedId) {
      const feedIndex = filteredFeeds.findIndex(
        (feed) => feed.feedId === feedId
      );
      if (feedIndex !== -1) {
        flatListRef.current?.scrollToIndex({
          index: feedIndex,
          animated: true,
          viewOffset: 0,
        });
        setSelectedFeedId(feedId);
        setIsCommentVisible(true);
      }
    }
  }, [feedId, filteredFeeds]);

  const handleRefresh = useCallback(async () => {
    console.log("[MainFeedScreen] Manual refresh triggered");
    setRefreshing(true);
    await loadFeeds(currentGroupId);
    setRefreshing(false);
  }, [currentGroupId, loadFeeds]);

  const renderItem = useCallback(
    ({ item }) => (
      <FeedItem
        feed={item}
        onDeleteSuccess={() => loadFeeds(currentGroupId)}
        isCommentVisible={isCommentVisible && item.feedId === selectedFeedId}
        setIsCommentVisible={setIsCommentVisible}
      />
    ),
    [currentGroupId, loadFeeds, isCommentVisible, selectedFeedId]
  );

  return (
    <SafeAreaView style={styles.container}>
      <MainHeader
        selectedGroup={currentGroupId}
        onPressCategory={() => {
          navigation.navigate("FeedGroupSelectScreen", {
            currentGroupId: currentGroupId,
          });
        }}
        onPressNotification={() => console.log("notification")}
      />
      {filteredFeeds && filteredFeeds.length > 0 ? (
        <FlatList
          ref={flatListRef}
          data={filteredFeeds}
          keyExtractor={(item) => String(item?.feedId || Math.random())}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          onScrollToIndexFailed={(info) => {
            console.log("Scroll to index failed:", info);
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.red20}
              colors={[Colors.red20]}
            />
          }
        />
      ) : (
        <EmptyState />
      )}
      <TouchableOpacity
        style={styles.addFeedButton}
        onPress={() => {
          navigation.navigate("CreatePost", {
            currentGroupId: currentGroupId,
            selectedGroupId: currentGroupId,
          });
        }}
      >
        <Image source={AddFeedIcon} style={styles.addFeedIcon} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBeige,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 72,
  },
  addFeedButton: {
    position: "absolute",
    bottom: 80,
    right: 20,
  },
  addFeedIcon: {
    width: 68,
    height: 68,
    resizeMode: "contain",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: Colors.textPrimary,
  },
  emptyDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
});

export default MainFeedScreen;
