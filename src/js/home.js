import cgssTable from "../template/table.vue";
import task from "../template/task.vue";
import downloader from "./batchDownload.js";
const dler = new downloader();
export default {
    components: {
        cgssTable,
        task
    },
    data(){
        return {
            queryString: "",
            text: "",
            data: [],
            selectedItem: [],
            current: 0,
            total: 0,
            isDisabled(row){
                return fs.existsSync(getPath(`./download/${(row.name.indexOf("/") === -1) ? row.name : row.name.split("/")[1]}`));
            }
        };
    },
    computed: {
        manifest(){
            return this.$store.state.manifest;
        }
    },
    methods: {
        opendir(){
            this.playSe(this.enterSe);
            system("if not exist download md download");
            exec("explorer " + getPath("./download"));
        },
        query(){
            if(this.queryString === ""){
                this.event.$emit("alert", this.$t("home.errorTitle"), this.$t("home.noEmptyString"));
            }
            else{
                this.data = this.manifest.filter(row => new RegExp(this.queryString).test(row.name));
            }
            this.playSe(this.enterSe);
        },
        tableChange(val){
            this.selectedItem = val;
        },
        stopDownload(){
            this.playSe(this.cancelSe);
            this.$refs.downloadBtn.removeAttribute("disabled");
            dler.stop(() => this.event.$emit("alert", this.$t("home.errorTitle"), this.$t("home.noTask")));
        },
        async downloadSelectedItem(){
            this.playSe(this.enterSe);
            system("if not exist download md download");
            if(!navigator.onLine){
                this.event.$emit("alert", this.$t("home.errorTitle"), this.$t("home.noNetwork"));
                return;
            }
            const task = this.selectedItem.slice(0);


            if(task.length > 0){
                this.$refs.downloadBtn.setAttribute("disabled", "disabled");
                let taskArr = [];
                for(let i = 0; i < task.length; i++){
                    if(task[i].name.split(".")[1] === "acb"){
                        taskArr.push([`http://storage.game.starlight-stage.jp/dl/resources/High/Sound/Common/${task[i].name.split("/")[0]}/${task[i].hash}`, getPath(`./download/${task[i].name.split("/")[1]}`), "acb"]);
                    }
                    else if(task[i].name.split(".")[1] === "unity3d"){
                        taskArr.push([`http://storage.game.starlight-stage.jp/dl/resources/High/AssetBundles/Android/${task[i].hash}`, getPath(`./download/${task[i].name.split(".")[0]}`), "unity3d"]);
                    }
                    else if(task[i].name.split(".")[1] === "bdb"){
                        taskArr.push([`http://storage.game.starlight-stage.jp/dl/resources/Generic/${task[i].hash}`, getPath(`./download/${task[i].name.split(".")[0]}`), "bdb"]);
                    }
                    else if(task[i].name.split(".")[1] === "mdb"){
                        taskArr.push([`http://storage.game.starlight-stage.jp/dl/resources/Generic/${task[i].hash}`, getPath(`./download/${task[i].name.split(".")[0]}`), "mdb"]);
                    }
                }
                let completed = 0;
                await dler.batchDl(taskArr, (name) => {
                    this.current = 0;
                    this.text = name;
                }, (prog) => {
                    this.text = `${prog.name}　${Math.ceil(prog.current / 1024)}/${Math.ceil(prog.max / 1024)} KB`;
                    this.current = prog.loading;
                    this.total = 100 * completed / taskArr.length + prog.loading / 100 * (100 / taskArr.length);
                }, (name, filepath, suffix) => {
                    if(suffix !== "acb"){
                        fs.readFile(filepath, "utf-8", (err, data) => {
                            if(data !== "File not found.\""){
                                if(suffix === "unity3d"){
                                    this.lz4dec(filepath, "unity3d");
                                }
                                else if(suffix === "bdb"){
                                    this.lz4dec(filepath, "bdb");
                                }
                                else if(suffix === "mdb"){
                                    this.lz4dec(filepath, "mdb");
                                }
                                system(`del /q /f .\\download\\${name.split(".")[0]}`);
                            }
                            else{
                                system(`del /q /f .\\download\\${name}`);
                            }
                        });
                        this.event.$emit("completeTask", name + "." + suffix);
                    }
                    else{
                        this.event.$emit("completeTask", name);
                    }
                    completed++;
                    this.current = 0;
                    this.text = "";
                }, () => {
                    this.current = 0;
                    this.text = "";
                });
                this.total = 0;
                this.$refs.downloadBtn.removeAttribute("disabled");
            }
            else{
                this.event.$emit("alert", this.$t("home.errorTitle"), this.$t("home.noEmptyDownload"));
            }
        }
    }
};