import React, { useState } from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'

import useGroupStore from '../store/groupStore'

import EditGroupModal from './modals/EditGroupModal'
import DeleteConfirmModal from './modals/DeleteConfirmModal'
import Colors from '../constants/colors'

const FriendsItem = ({ friend, onMoveGroup, onDelete }) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const groups = useGroupStore((state) => state.groups) // 그룹 목록 가져오기

  //친구 그룹 추가
  const handleGroupChange = async (newGroupId) => {
    try {
      console.log('선택된 groupId:', newGroupId) // 디버깅
      await onMoveGroup(friend.friendId._id, newGroupId)
      setIsModalVisible(false)
    } catch (error) {
      console.error('그룹 변경 실패:', error)
    }
  }

  // 친구가 속한 그룹 이름 찾기
  const getGroupName = (groupId) => {
    console.log('groups in getGroupName:', groups)
    console.log('현재 friend의 group:', groupId)

    if (!groupId || groupId === 'null' || groupId === null) {
      return '전체'
    }

    if (!groups || groups.length === 0) {
      console.log('그룹 정보가 없음')
      return '전체'
    }

    // 직접 groupId로 찾기
    const foundGroup = groups.find((group) => group.id === groupId)
    console.log('찾은 그룹:', foundGroup)

    if (foundGroup) {
      return foundGroup.name
    }

    // members 배열로도 확인
    const groupByMember = groups.find((group) => group.members && group.members.includes(friend.friendId._id))
    console.log('멤버로 찾은 그룹:', groupByMember)

    return groupByMember ? groupByMember.name : '전체'
  }

  const handleDeleteClick = () => {
    setIsDeleteModalVisible(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await onDelete(friend._id)
      if (!result?.success) {
        Toast.show({
          type: 'error',
          text1: '친구 삭제 실패',
          text2: result?.error || '잠시 후 다시 시도해주세요',
          position: 'bottom',
          bottomOffset: 100,
        })
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: '오류 발생',
        text2: '잠시 후 다시 시도해주세요',
        position: 'bottom',
        bottomOffset: 100,
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteModalVisible(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileContainer}>
        {friend.friendId.profileImage ? (
          <Image source={{ uri: friend.friendId.profileImage }} style={styles.profileImage} />
        ) : (
          <View style={[styles.profileImage, styles.profileImagePlaceholder]} />
        )}
        <View style={styles.infoContainer}>
          <Text style={styles.nickname}>{friend.friendId.nickname}</Text>
          <Text style={styles.groupText}>{getGroupName(friend.group)}</Text>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.groupButton} onPress={() => setIsModalVisible(true)}>
          <Text style={styles.groupButtonText}>그룹 이동</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteClick}>
          <Feather name="trash-2" size={20} color={Colors.gray30} />
        </TouchableOpacity>

        <EditGroupModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onConfirm={handleGroupChange}
          selectedFriendId={friend.friendId._id}
          friendName={friend.friendId.nickname}
        />

        <DeleteConfirmModal
          visible={isDeleteModalVisible}
          onClose={() => setIsDeleteModalVisible(false)}
          onConfirm={handleConfirmDelete}
          friendName={friend.friendId.nickname}
          loading={isDeleting}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: Colors.primaryBeige,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  profileImagePlaceholder: {
    backgroundColor: Colors.gray20,
  },
  infoContainer: {
    marginLeft: 12,
  },
  nickname: {
    fontFamily: 'Pretendard',
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkRed20,
    marginBottom: 4,
  },
  groupText: {
    fontFamily: 'Pretendard',
    fontSize: 14,
    fontWeight: '400',
    color: Colors.darkRed20,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupButton: {
    backgroundColor: Colors.gray30,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  groupButtonText: {
    color: Colors.lightBeige,
    fontSize: 14,
    fontFamily: 'Pretendard',
    fontWeight: '600',
    lineHeight: 17,
  },
  deleteButton: {
    padding: 6,
  },
})

export default FriendsItem
