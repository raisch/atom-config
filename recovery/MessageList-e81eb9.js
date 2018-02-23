import React from "react";
import emojiTree from "emoji-tree";
import {Scrollbars} from "react-custom-scrollbars";
import messageHelper from "../../helpers/MessageHelper";
import Session from "../../../middleware/Session";
import { connect } from 'react-redux';
import {emojify} from 'react-emojione';
import moment from 'moment';
import Linkify from 'react-linkify';
import * as actions from '../../../actions/chatActions';
import ImageModal from "./ImageModal.js";
import UploadIcon from "./UploadIcon.js";
import MessageListScrollBar from './MessageListScrollBar';

const CHAT_HEIGHT = 270;
const EMOJI_PICKER_ADD_FRIEND_HEIGHT = 20;
const EMOJI_PICKER_HEIGHT = 70;
const ADD_FRIEND_HEIGHT = 50;
const DEFAULT_PROFILE_PIC = "/images/default-profile-pic.png";

class MessageList extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        minimizeChat : this.props.minimizeChat,
        iconIndex: 0,
        iconHover: false,
        iconUnHover: false,
        fileToUpload: this.props.fileToUpload,
        fileUploading: this.props.fileUploading,
        uploadPercentage: this.props.uploadPercentage,
        fileSize: this.props.fileSize,
        channelMemberInfo: this.props.channelMemberInfo ? this.props.channelMemberInfo : {}
      };
      this.loggedUser = this.props.loggedUser;
      this.scrollToBottom = this.scrollToBottom.bind(this);
      this.messageHTML = this.messageHTML.bind(this);
      this.shouldShowSingleEmoji = this.shouldShowSingleEmoji.bind(this);
      this.shouldShowProfilePic = this.shouldShowProfilePic.bind(this);
    }

  componentDidMount() {
    this.scrollToBottom();
  }

  componentDidUpdate() {
    if (!(this.state.iconHover || this.state.iconUnHover)) {
      this.scrollToBottom();
    }
  }

  componentWillReceiveProps(nextProps) {
    if(this.state.fileToUpload !== nextProps.fileToUpload){
      this.setState({fileToUpload: nextProps.fileToUpload});
    }
    if(this.state.fileUploading !== nextProps.fileUploading){
      this.setState({fileUploading: nextProps.fileUploading});
    }
    if(this.state.uploadPercentage !== nextProps.uploadPercentage){
      this.setState({uploadPercentage: nextProps.uploadPercentage});
    }
    if(this.state.fileSize !== nextProps.fileSize){
      this.setState({fileSize: nextProps.fileSize});
    }

    let updatedChannelMemberInfo = nextProps.chat.channelMemberInfo ? nextProps.chat.channelMemberInfo : {};
    // need to update the state to scroll to bottom
    this.setState({
      iconHover: false,
      iconUnHover: false,
      channelMemberInfo: updatedChannelMemberInfo
    });
  }

  scrollToBottom() {
    let scrollbars = this.refs.messageListScrollBar.refs.msgScrollBar;
    if (scrollbars) {
      scrollbars.scrollToBottom();
    }
  }

  setAsActiveBubble() {
    let convId = "usr:" + this.props.conv.proglobeTitle;
    this.props.setActiveBubbleId(convId);
  }

  onIconHover(index){
    this.setState({
      iconHover: true,
      iconUnHover: false,
      iconIndex: index
    });
  }

    onIconUnHover(){
      this.setState({
        iconHover: false,
        iconUnHover: true,
        iconIndex: 0
      });
    }

    messageHTML(messageTree) {
      return (
        <span>
        {
          messageTree.map((character) => {
            if (character.type === 'emoji') {
              return <span className="emoji-inline-text">{character.text}</span>;
            }
            return character.text;
          })
        }
        </span>
      );
    }

    shouldShowSingleEmoji(emojiTreeOutput) {
      return emojiTreeOutput.length === 1 && emojiTreeOutput[0].type === "emoji";
    }

    shouldShowProfilePic(currentMessage, nextMessage) {
      let me = Session.getSession('prg_lg');
      return currentMessage.author !== me.id && (!nextMessage || nextMessage.author === me.id);
    }

    render() {
        let _this = this;
        let receiver_image = DEFAULT_PROFILE_PIC;
        let _messages = null;
        let singleEmoji = false;

        // NOTE: key is not the actual index of a twilio message.
        // Since twilio messages are paged (30 messages per page), you will need to access this via msg.index.
        if (this.props.messages) {
          _messages = this.props.messages.map((msg, key) => {
              let conversation = this.props.conv;
              let author = msg.author;
              let messageIndex = msg.index;
              let channelMemberInfo = this.state.channelMemberInfo;

              let userName = Session.getSession('prg_lg').id;
              let lastSeenIndicator = null;

              let channelSid = msg.channel.sid;

              let memberIndex = -1;
              let channelMembers = channelMemberInfo[channelSid].members;
              if (author === userName) {
                if (channelMembers) {
                  for (let i = 0; i < channelMembers.length; i++) {
                    if (channelMembers[i].identity !== userName) { // someone else on the channel.
                      memberIndex = i;
                    }
                  }
                }

                if (memberIndex > -1) {
                  let member = channelMembers[memberIndex];
                  // Find the last updated index here
                  if (msg.index === member.lastConsumedMessageIndex) {
                    let lastConsumed = moment(member.lastConsumptionTimestamp).fromNow();
                    lastSeenIndicator = "seen " + lastConsumed;
                  }
                }
              }

              let content = JSON.parse(msg.body);
              let messageText = '';
              if (content.payload.text) {
                messageText = emojify(content.payload.text, { output: 'unicode' });
              }

              const emojiTreeOutput = emojiTree(messageText);
              let messageHTMLified = _this.messageHTML(emojiTreeOutput);

              singleEmoji = _this.shouldShowSingleEmoji(emojiTreeOutput);

              //time and date of the message
              let msg_time = msg.timestamp + "";
              let fileSize = "~" + messageHelper.convertFileSize(content.payload.file_size);

              // Check message to see if we should show profile picture of the otheruser.
              let nextMessage = this.props.messages[key + 1];
              let shouldShowProfilePic = _this.shouldShowProfilePic(msg, nextMessage);

              if (shouldShowProfilePic) {
                // Get the correct profile picture for group chats.
                for (let j = 0; j < conversation.userNames.length; j++) {
                  if (conversation.userNames[j].id === author) {
                    receiver_image = conversation.userNames[j].currentAvatarUrl;
                  }
                }
              }

              return (
                  <div className={author !== userName ? "chat-msg received " + msg.grouping : "chat-msg sent " + msg.grouping} key={key}>
                      {
                        (shouldShowProfilePic) &&
                          <span className="pro-img">
                            <img src={receiver_image} className="img-responsive" />
                          </span>
                      }
                      {
                          (content.type === "FILE_UPLOAD" || content.type === "IMAGE_UPLOAD") ?
                              content.type === "IMAGE_UPLOAD" ?
                            /*Image Preview/Modal on Chat*/
                              <div>
                                <ImageModal
                                  imgSrc={content.payload.url}
                                  name={messageHelper.findFileTypeIconColor(content.payload.file_name)[0]}
                                  imgDownURL={content.payload.url}
                                  sentDate={msg_time}
                                  modalFooterImg={receiver_image}
                                />
                                {
                                  lastSeenIndicator &&
                                    <div className="msg-seen-container">
                                      <span>
                                        <img className="msg-seen-indicator-image" src="/images/quick-chat/checkmark.svg" />
                                      </span>
                                      <p className="msg-seen-indicator-text">{lastSeenIndicator}</p>
                                    </div>
                                }
                              </div>

                            /* End of Image Preview/Modal Code on Chat*/
                            :
                              (messageHelper.imgFileTypes.indexOf(messageHelper.getFileType(content.payload.file_name)) !== -1) ?
                                <div>
                                  <ImageModal
                                    imgSrc={content.payload.url}
                                    name={messageHelper.findFileTypeIconColor(content.payload.file_name)[0]}
                                    imgDownURL={content.payload.url}
                                    sentDate={msg_time}
                                    modalFooterImg={receiver_image}
                                  />
                                  {
                                    lastSeenIndicator &&
                                      <div className="msg-seen-container">
                                        <span>
                                          <img className="msg-seen-indicator-image" src="/images/quick-chat/checkmark.svg" />
                                        </span>
                                        <p className="msg-seen-indicator-text">{lastSeenIndicator}</p>
                                      </div>
                                  }
                                </div>
                            :
                              <div>
                                <div className="chat-msg-files" style={messageHelper.findFileTypeIconColor(content.payload.file_name)[2]}>
                                  <a href={content.payload.url} className="chat-file" target="_blank">
                                      <p className="chat-file-names" style={messageHelper.findFileTypeIconColor(content.payload.file_name)[1]}>
                                          {messageHelper.findFileTypeIconColor(content.payload.file_name)[0]}
                                      </p>
                                      <span className={"chat-file-icon " + messageHelper.findFileTypeIconColor(content.payload.file_name)[3]} onMouseEnter={_this.onIconHover.bind(_this,key)} onMouseLeave={_this.onIconUnHover.bind(_this)}> </span>
                                      {(_this.state.iconIndex === key && _this.state.iconHover) &&
                                        <span className="file-size-styles" style={{color:'black'}}>{fileSize}</span>
                                      }
                                  </a>
                                </div>
                              {
                                lastSeenIndicator &&
                                  <div className="msg-seen-container">
                                    <span>
                                      <img className="msg-seen-indicator-image" src="/images/quick-chat/checkmark.svg" />
                                    </span>
                                    <p className="msg-seen-indicator-text">{lastSeenIndicator}</p>
                                  </div>
                                }
                             </div>
                :
                (
                  (singleEmoji && content.payload.text) ?
                    <div>
                      <p className={author !== userName ? "single-emoji-msg single-emoji-msg-received" : "single-emoji-msg single-emoji-msg-sent"}>{messageText}</p>
                      {
                          lastSeenIndicator &&
                            <div className="msg-seen-container">
                              <span>
                                <img className="msg-seen-indicator-image" src="/images/quick-chat/checkmark.svg" />
                              </span>
                              <p className="msg-seen-indicator-text">{lastSeenIndicator}</p>
                            </div>
                        }
                    </div>
                    :
                    (content.type === "PLAINTEXT") &&
                      <div>
                        <p className="msg">
                          {messageHelper.containsLink(content.payload.text)[0] ?
                            <Linkify properties={{target: '_blank', style: {color: 'white', overflowWrap: 'break-word !important'}}}>
                              {messageText}
                            </Linkify>
                            :
                            messageHTMLified
                          }
                        </p>
                        {
                          lastSeenIndicator &&
                            <div className="msg-seen-container">
                              <span>
                                <img className="msg-seen-indicator-image" src="/images/quick-chat/checkmark.svg" />
                              </span>
                              <p className="msg-seen-indicator-text">{lastSeenIndicator}</p>
                            </div>
                        }
                      </div>
                )
            }
            {
              (content.type === "HANDSHAKE") &&
                <img className="msg-shake" src="/images/quick-chat/Handshake.png"/>
            }
          </div>
        );
      });
    }

        // Properly show emoji picker and add friend box if both are selected.
        let chatHeight = CHAT_HEIGHT;
        if (!this.props.minimizeChat) {
          if (this.props.emojiPickerActive && this.props.addFriendActive) {
            chatHeight = EMOJI_PICKER_ADD_FRIEND_HEIGHT;
          } else if (this.props.emojiPickerActive) {
            chatHeight = EMOJI_PICKER_HEIGHT;
          } else if (this.props.addFriendActive) {
            chatHeight -= ADD_FRIEND_HEIGHT;
          }
        }

        return (
            <div className="conv-holder" onClick={this.setAsActiveBubble.bind(this)} style={{height: chatHeight}} id="chat-msg-list">
                <MessageListScrollBar className='qc-emergency-class'
                  autoHide
                  autoHideTimeout={1000}
                  autoHideDuration={200}
                  ref="messageListScrollBar"
                  >
                    {_messages}
                    {(this.state.fileToUpload !== '' && this.state.fileUploading) &&
                        <div className="chat-msg sent">
                            <div className="chat-msg-files" style={messageHelper.findFileTypeIconColor(this.state.fileToUpload)[2]}>
                                    <a href='#' className="chat-file" target="_blank">
                                        <p className="chat-file-names" style={messageHelper.findFileTypeIconColor(this.state.fileToUpload)[1]}>
                                            {messageHelper.findFileTypeIconColor(this.state.fileToUpload)[0]}
                                        </p>
                                        <UploadIcon
                                            uploadFileName={this.state.fileToUpload}
                                            uploadPercentage={this.state.uploadPercentage}
                                        />
                                        <p className="upload-text-styles" style={{color:'black'}}>Uploading {messageHelper.convertFileSize(this.state.fileSize)} - {this.state.uploadPercentage}%</p>
                                    </a>
                            </div>
                        </div>
                    }
                    {
                        /*This is the UI to show that someone else is currently typing */
                        this.props.someoneTyping &&
                            <div className="chat-msg received">
                              <img src="/images/quick-chat/someone_typing.gif" className="img-responsive someone-typing" />
                            </div>
                    }
                </MessageListScrollBar>
            </div>
        );
    }
}

const mapStateToProps = (state) => {
  return {
    channelMemberInfo: state.chat.channelMemberInfo,
    ...state
  };
}

const mapDispatchToProps = (dispatch) => {
  return {
    onLoadReduxConversation(conversation) {
      dispatch(actions.loadExistingConversation(conversation));
    },
    onLoadNewReduxConversation(conversation) {
      dispatch(actions.loadNewConversation(conversation));
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MessageList);
