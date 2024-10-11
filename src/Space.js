class Space {
    constructor(name, imageUrl,localImgUrl, plyUrl, jsonContent) {
        this.name = name;
        this.imageUrl = imageUrl;
        this.plyUrl = plyUrl;
        this.localImgUrl=localImgUrl;
        this.jsonContent = jsonContent;
        this.downloaded = false;
        this.downloading = false;
        this.modelLocalURL = "";
    }
}
export default Space
