import React from 'react';
import ReactWebcam from 'react-webcam';
import fetch from 'node-fetch';

import {
  Row,
  Col,
  Button,
  Upload,
  Space,
  List,
  Slider,
  Typography,
  Image
} from 'antd';

import {FileAddFilled} from '@ant-design/icons';
import Cropper from 'react-easy-crop';
import getCroppedImg from './cropImage'
const { Title, Paragraph, Text, Link } = Typography;

export default class ImageTab extends React.Component {
  constructor(props) {
    super(props);
    console.log('ImageTab props=', props);

    this.state = {
      cameraEnabled: false,
      image: null,
      fileURI: '',
      crop: {
        x: 0,
        y: 0
      },
      rotation: 0,
      zoom: 1,
      croppedAreaPixels: null,
      croppedImage: null
    }
  }

  photoOptions = {
    types: {
      value: [
        'image/jpeg', 'image/png'
      ],
      label: '.jpg, .jpeg, .png'
    },
    size: {
      value: 2 * 1024 * 1024,
      label: '2 MB'
    }
  }

  cameraConstraints = {
    width: {
      min: 640,
      ideal: 1920
    }, //     width: { min: 640, ideal: 1280, max: 1920 },
    height: {
      min: 480,
      ideal: 1080
    } //     height: { min: 480, ideal: 720, max: 1080 }
  }
  styles = {
    cropContainer: {
      position: 'relative',
      width: '100%',
      height: 400,
      background: '#000'
    },
    cropButton: {
      flexShrink: 0,
      marginLeft: 16
    },
    controls: {
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch'

    },
    sliderLabel: {},
    slider: {
      padding: '22px 0px',
      marginLeft: 32
    }
  }

  imageRulesList = [
    {
      title: 'Face the camera',
      description: 'The submitter facial features must be visible with good enough lightning conditions.'
    }, {
      title: 'Show your real self',
      description: 'The submitters should not be covered under heavy make-up, large piercings or masks.'
    }, {
      title: '',
      description: ''
    },
  ]
  setCrop = (crop) => {
    console.log(crop);
    this.setState({crop})
  };
  setRotation = (rotation) => {
    console.log(rotation)
    this.setState({rotation})
  };
  setZoom = (zoom) => {
    console.log(zoom)
    this.setState({zoom})
  };
  setCroppedAreaPixels = (croppedAreaPixels) => {
    console.log(croppedAreaPixels)
    this.setState({croppedAreaPixels})
  };
  setCroppedImage = (croppedImage) => this.setState({croppedImage});

  onCropComplete = (croppedArea, croppedAreaPixels) => {
    this.setCroppedAreaPixels(croppedAreaPixels)
  }

  showCroppedImage = async () => {
    try {
      const croppedImage = await getCroppedImg(this.state.image, this.state.croppedAreaPixels, this.state.rotation)
      console.log('donee', {croppedImage})
      let buffer = this.urlB64ToUint8Array(croppedImage.split(',')[1]);
      console.log(buffer)
      this.setCroppedImage(croppedImage)
      this.setState({picture: buffer})
    } catch (e) {
      console.error(e)
    }
  }

  onClose = () => {
    this.setCroppedImage(null)
  }

  enableCamera = () => {
    console.log(this.camera);
    this.setState({cameraEnabled: true});
  }

  urlB64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++ i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
  draggerProps = {
    name: 'file',
    multiple: false,
    accept: this.photoOptions.types.label,
    onChange: ({file}) => {
      console.log('onChange file=', file);

      let blob = new Blob([file.originFileObj], {type: file.type});
      let imageURL = window.URL.createObjectURL(blob);
      console.log(blob)
      blob.arrayBuffer().then((arrayBuffer) => {
        this.setState({picture: arrayBuffer, image: imageURL});
      });

      console.log('onChange imageURL=', imageURL);

    },
    onDrop(event) {
      console.log('Dropped files', event.dataTransfer.files);
    }
  }
  uploadPicture = () => {

    let picture = this.state.picture;
    console.log(picture)

    let requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(
        {buffer: Buffer.from(picture)}
      )
    };

    console.log('photo requestOption=', requestOptions);

    fetch(process.env.NEXT_PUBLIC_MEDIA_SERVER + '/photo', requestOptions).then(response => response.json()).then(({URI}) => {
      console.log('Image URI=', URI);
      this.setState({fileURI: URI});
      this.props.stateHandler({imageURI: URI});
      this.props.next()
    }).catch(error => { // Handle errors
      console.log('Image upload error=', error);
      this.setState({
        picture: false,
        // cameraEnabled: true?
      });
    });
  }

  takePicture = () => {
    console.log(this.camera);
    let picture = this.camera.getScreenshot();
    let buffer = this.urlB64ToUint8Array(picture.split(',')[1]);
    console.log('Picture b64=', picture);
    let blob = new Blob([buffer], {type: "buffer"});
    console.log(blob)
    let imageURL = window.URL.createObjectURL(blob);
    console.log(imageURL)
    // this.uploadPicture(picture); // we shouldn't upload every time a picture is taken, but at the end/when user selects it as final image

    // this.props.stateHandler({ picture }, 'ImageTab'); // proof props method can be called (save form status)
    // send picture as props and dont use image state?

    this.setState({picture: buffer, image: imageURL, cameraEnabled: false});
  }

  retakePicture = () => {
    this.setState({
      picture: null,
      image: '',
      cameraEnabled: false,
      croppedImage: null,
      croppedAreaPixels: null,
      zoom: 1,
      crop: {
        x: 0,
        y: 0
      },
      rotation: 0
    })
  }

  onUserMedia = (mediaStream) => {
    console.log('User media detected', mediaStream);
    // this.camera.video.webkitRequestFullscreen();
    // this.screen.webkitRequestFullscreen();
  }

  onUserMediaError(error) {
    console.error('User media error', error);
  }


  render() {
    return (
      <>
        <Row>
          <Space direction="vertical"
            size={1}>
            <h2>Upload your image</h2>
            <Paragraph>
              In this step you will need to select a file or take an image with
                                                                your camera of your face
            </Paragraph>
          </Space>
        </Row>
        <Row>
          <List style={
              {width: "100%"}
            }
            itemLayout="horizontal"
            dataSource={
              this.imageRulesList
            }
            renderItem={
              (item) => (
                <List.Item>
                  <List.Item.Meta title={
                      item.title
                    }
                    description={
                      item.description
                    }/>
                </List.Item>
              )
            }/>
        </Row>
      {
      this.state.cameraEnabled ? (
        <div className="video-inner-container"
          ref={
            (screen) => {
              this.screen = screen;
            }
        }>
          <div className="video-overlay">Text inside video!</div>
          <ReactWebcam style={
              {width: "100%"}
            }
            ref={
              (camera) => {
                this.camera = camera;
              }
            }
            mirrored={false}
            screenshotFormat={"image/jpeg"}
            screenshotQuality={1}
            forceScreenshotSourceSize
            videoConstraints={
              this.cameraConstraints
            }
            onCanPlayThrough={
              () => false
            }
            onClick={
              (event) => event.preventDefault()
            }
            onUserMedia={
              this.onUserMedia
            }
            onUserMediaError={
              this.onUserMediaError
          }>
            <div>TEST</div>
          </ReactWebcam>
          <button onClick={
            this.takePicture
          }>Take image!</button>
        </div>
      ) : !this.state.picture ? (
        <Row>
          
          <Col span={12}>
            <div>
              <button onClick={
                this.enableCamera
              }>Enable camera</button>
            </div>
          </Col>
          <div>
            <Col span={12}>
              <Upload.Dragger {...this.draggerProps}>
                <FileAddFilled/>

                <p className="ant-upload-text">
                  Click or drag file to this area to upload
                </p>
                <p className="ant-upload-hint">
                  Photo&apos;s format can be: {
                  this.photoOptions.types.label
                } </p>
              </Upload.Dragger>
            </Col>
          </div>
         
        </Row>
      ) : null
    }
      {
      this.state.image && this.state.picture && !this.state.croppedImage && (
        <React.Fragment>
          <div style={
            this.styles.cropContainer
          }>
            <Cropper image={
                this.state.image
              }
              crop={
                this.state.crop
              }
              rotation={
                this.state.rotation
              }
              zoom={
                this.state.zoom
              }
              aspect={1}
              cropShape={"round"}
              onCropChange={
                this.setCrop
              }
              onRotationChange={
                this.setRotation
              }
              onCropComplete={
                this.onCropComplete
              }
              onZoomChange={
                this.setZoom
              }/>
          </div>
          <div style={
            this.styles.controls
          }>
            <div style={
              this.styles.sliderContainer
            }>

              Zoom

              <Slider value={
                  this.state.zoom
                }
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={
                  (zoom) => this.setZoom(zoom)
                }/>
            </div>
            <div style={
              this.styles.sliderContainer
            }>

              Rotation

              <Slider value={
                  this.state.rotation
                }
                min={0}
                max={360}
                step={1}
                aria-labelledby="Rotation"

                onChange={
                  (rotation) => this.setRotation(rotation)
                }/>
            </div>
            <Button onClick={
                this.showCroppedImage
              }
              variant="contained"
              color="primary">
              Show Result
            </Button>
          </div>
        </React.Fragment>
      )
    }
      {
      this.state.croppedImage ? (
        <div style={
          {textAlign: "center"}
        }>
          <Space direction="vertical">
          This is your picture:
          <Image style={
              {width: "100%"}
            }
            src={
              this.state.croppedImage
            }
            alt="Crop result"/>
          
          </Space>
          <Space direction="horizontal">
          <Button onClick={
            this.retakePicture
          }>Start over</Button>
          </Space>
          

        </div>
      ) : null
    } 
    <Row>
        <Button type='primary' shape='round' style={{display:'block', margin:'0 auto', backgroundColor:"#ffb978", border:'none'}} onClick={this.props.prev}>Previous</Button>
        <Button type='primary' disabled={this.state.croppedImage == null} shape='round' style={{display:'block', margin:'0 auto', backgroundColor:"#ffb978", border:'none'}} onClick={this.uploadPicture}>Next</Button>
         
        </Row>
        </>
    );
    
  }
}
