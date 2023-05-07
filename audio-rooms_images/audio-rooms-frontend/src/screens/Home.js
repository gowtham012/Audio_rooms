import './Home.css'
import {Button, Form, notification, Tabs} from "antd";
import {useState, useEffect} from "react";
import Input from "antd/es/input/Input";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import axios from "axios";
import {getConstants} from "../js/Utils";
const { TabPane } = Tabs;

const constants = getConstants();

export const Home = ({defaultTabProp}) => {
  const {prefilledRoomId} = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  let data = location.state || {}
  const [api, contextHolder] = notification.useNotification();
  const [tab, setActiveTab] = useState(data.tab || defaultTabProp || '1');
  const [roomId, setRoomId] = useState(prefilledRoomId || "");
  const [roomName, setRoomName] = useState("");
  const [name, setName] = useState("");

  useEffect (() => {
    console.log('raw state: ', data)
    if (defaultTabProp !== null && data.tab === null)
      data.tab = defaultTabProp

    console.log('state: ', data)
    if (data != null) {
      if (data.hasOwnProperty('tab'))
        setActiveTab(data['tab'])
      if (data.hasOwnProperty('errorMsg')) {
        const errorMsg = data['errorMsg']
        console.log("error: ", errorMsg);
        if (errorMsg !== "") {
          api.error({
            message: errorMsg,
            placement: "bottom",
            duration: 3
          })
        }
      }
    }
  }, [])

  const createRoomRequest = () => {
    console.log("create room with roomName ", roomName, ' ownerName ', name);
    api.info({
      message: "Creating room in background. Will put you in room shortly",
      placement: "bottom",
      duration: 3
    })
    axios.post(constants.urls.createRoomUrl, {name: roomName}).then((res) => {
      console.log(res.data)
      const roomDetails = res.data
      navigate('/room', {state: {roomId: roomDetails.id, myName: name}})
    }).catch((e) => {
      console.error('unable to create room', e);
      api.error({
        message: "Ah fck, we will be right back soon",
        placement: "bottom",
        duration: 3
      })
    });
  }

  const joinRoomRequest = () => {
    api.info({
      message: "You will be in room shortly",
      placement: "bottom",
      duration: 3
    })
    console.log("join room with roomName ", roomName, ' peerName ', name);
    navigate('/room', {state: {roomId: roomId, myName: name}})
  }

  const getCreateRoomContent = () => {
    return (
      <div className="create-room-div">
        <Form
          layout={"vertical"}
          style={{ maxWidth: 400 }}
        >
          <Form.Item label="Lets give our new room, a name!">
            <Input placeholder="We all hate boring names, keep it interesting"
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
            />
          </Form.Item>

          <Form.Item label="Shit, I forgot to ask you. What's your name btw?">
            <Input placeholder="Just your real name please"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={() => createRoomRequest()}>Create</Button>
          </Form.Item>
        </Form>
      </div>
    )
  }


  const getJoinRoomContent = () => {
    return (
      <div className="join-room-div">
        <Form
          layout={"vertical"}
          style={{ maxWidth: 400 }}
        >
          <Form.Item label="Room ID">
            <Input value={roomId}
                   placeholder={"Mostly, Auto filled"}
                   onChange={e => setRoomId(e.target.value)}
            />
          </Form.Item>

          <Form.Item label="Just one thing before we let you in. Your name please">
            <Input placeholder="Just your real name please"
                   value={name}
                   onChange={e => setName(e.target.value)}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={() => joinRoomRequest()}>Enough, Let me in</Button>
          </Form.Item>
        </Form>
      </div>
    )
  }

  const getContent = () => {
    return (
      <div className="content">
        <Tabs activeKey={tab} type="card" onChange={(key) => setActiveTab(key)}>
          <TabPane tab="Create Room" key="1">
            {getCreateRoomContent()}
          </TabPane>
          <TabPane tab="Join Room" key="2">
            {getJoinRoomContent()}
          </TabPane>
        </Tabs>
      </div>
    )
  }

  return (
    <div className="Home">
      {contextHolder}
      <div className="Header">
        <p>audio rooms</p>
      </div>
      <hr/>
      {getContent()}
    </div>
  )
}