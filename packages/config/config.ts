interface TlsConfig {
  key: string;
  cert: string;
}

interface WebConfig {
  development: boolean;
  address: string;
  port: number;
  ports: number[]; // An array of numbers for additional ports
  loginUrl: string;
  cdnUrl: string;
  maintenance: {
    enable: boolean;
    message: string;
  };
  tls: TlsConfig;
}

interface WebFrontendConfig {
  root: string;
  port: number;
  tls: TlsConfig;
}

interface ServerConfig {
  bypassVersionCheck: boolean;
  logLevel: 'info' | 'warn' | 'error' | 'debug'; // Using a union type for better strictness
  antiCheat: string;
  clientConf: string;
}

export interface AppConfig {
  web: WebConfig;
  webFrontend: WebFrontendConfig;
  server: ServerConfig;
}


export const config: AppConfig = {
  web: {
    development: true,
    address: "127.0.0.1",
    port: 3001,
    ports: [17091],
    loginUrl: "growserver.app",
    cdnUrl: "growserver-cache.netlify.app",
    maintenance: {
      enable: false,
      message: "Maintenance Woi"
    },
    tls: {
      key: "./assets/ssl/server.key",
      cert: "./assets/ssl/server.crt"
    }
  },
  webFrontend: {
    root: "./public",
    port: 3000,
    tls: {
      key: "./assets/ssl/server.key",
      cert: "./assets/ssl/server.crt"
    }
  },
  server: {
    bypassVersionCheck: true,
    logLevel: "info",
    antiCheat: "cc.cz.madkite.freedom org.aqua.gg idv.aqua.bulldog com.cih.gamecih2 com.cih.gamecih com.cih.game_cih cn.maocai.gamekiller com.gmd.speedtime org.dax.attack com.x0.strai.frep com.x0.strai.free org.cheatengine.cegui org.sbtools.gamehack com.skgames.traffikrider org.sbtoods.gamehaca com.skype.ralder org.cheatengine.cegui.xx.multi1458919170111 com.prohiro.macro me.autotouch.autotouch com.cygery.repetitouch.free com.cygery.repetitouch.pro com.proziro.zacro com.slash.gamebuster",
    clientConf: 'proto=225|choosemusic=audio/mp3/about_theme.mp3|active_holiday=0|wing_week_day=0|ubi_week_day=0|server_tick=8073984|clash_active=1|drop_lavacheck_faster=1|isPayingUser=0|usingStoreNavigation=1|enableInventoryTab=1|bigBackpack=1|m_clientBits=3072|eventButtons={"EventButtonData":[{"active":false,"buttonAction":"eventmenu","buttonTemplate":"BaseEventButton","counter":0,"counterMax":0,"itemIdIcon":6244,"name":"ClashEventButton","order":9,"rcssClass":"clash-event","text":""},{"active":true,"buttonAction":"dailychallengemenu","buttonTemplate":"BaseEventButton","counter":0,"counterMax":0,"itemIdIcon":23,"name":"DailyChallenge","order":10,"rcssClass":"daily_challenge","text":""},{"active":true,"buttonAction":"openPiggyBank","buttonTemplate":"BaseEventButton","counter":0,"counterMax":0,"name":"PiggyBankButton","order":20,"rcssClass":"piggybank","text":""},{"active":false,"buttonAction":"showdungeonsui","buttonTemplate":"DungeonEventButton","counter":0,"counterMax":20,"name":"ScrollsPurchaseButton","order":30,"rcssClass":"scrollbank","text":""},{"active":false,"buttonAction":"show_bingo_ui","buttonTemplate":"BaseEventButton","counter":0,"counterMax":0,"name":"WinterBingoButton","order":49,"rcssClass":"wf-bingo","text":""},{"active":false,"buttonAction":"show_bingo_ui","buttonTemplate":"BaseEventButton","name":"UbiBingoButton","order":50,"rcssClass":"ubi-bingo","text":""},{"active":false,"buttonAction":"winterrallymenu","buttonTemplate":"BaseEventButton","counter":0,"counterMax":0,"name":"WinterRallyButton","order":50,"rcssClass":"winter-rally","text":""},{"active":false,"buttonAction":"leaderboardBtnClicked","buttonTemplate":"BaseEventButton","counter":0,"counterMax":0,"name":"AnniversaryLeaderboardButton","order":50,"rcssClass":"anniversary-leaderboard","text":""},{"active":false,"buttonAction":"euphoriaBtnClicked","buttonTemplate":"BaseEventButton","counter":0,"counterMax":0,"name":"AnniversaryEuphoriaButton","order":50,"rcssClass":"anniversary-euphoria","text":""},{"active":false,"buttonAction":"openLnySparksPopup","buttonTemplate":"BaseEventButton","counter":0,"counterMax":5,"name":"LnyButton","order":50,"rcssClass":"cny","text":""},{"active":false,"buttonAction":"ShowValentinesQuestDialog","buttonTemplate":"EventButtonWithCounter","counter":0,"counterMax":100,"name":"ValentinesButton","order":50,"rcssClass":"valentines_day","text":""},{"active":false,"buttonAction":"showegseeventui","buttonTemplate":"EventButtonWithCounter","counter":0,"counterMax":20,"name":"EasterButton","order":50,"rcssClass":"easter_event","text":""},{"active":false,"buttonAction":"openStPatrickPiggyBank","buttonTemplate":"BaseEventButton","name":"StPatrickPBButton","order":50,"rcssClass":"st_patrick_event","text":""},{"active":false,"buttonAction":"dailyrewardmenu","buttonTemplate":"BaseEventButton","counter":0,"counterMax":1,"name":"CincoPinataButton","order":50,"rcssClass":"cinco_pinata_event","text":""}]}'
  }
};
