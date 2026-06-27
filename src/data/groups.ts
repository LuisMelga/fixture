import type { GroupId, MatchTuple } from '../domain/types';
export interface GroupData { id: GroupId; teams: string[]; m: MatchTuple[]; }
export const GROUPS: GroupData[] = [
  {id:"A",teams:["MEX","RSA","COR","RPC"],m:[
    ["A1","Jue 11 Jun · 16:00","Estadio Ciudad de México","MEX","RSA"],
    ["A2","Jue 11 Jun · 23:00","Estadio Guadalajara","COR","RPC"],
    ["A3","Lun 15 Jun · 13:00","Estadio Atlanta","RPC","RSA"],
    ["A4","Jue 18 Jun · 19:00","Estadio Guadalajara","MEX","COR"],
    ["A5","Mié 24 Jun · 22:00","Estadio Monterrey","RSA","COR"],
    ["A6","Mié 24 Jun · 22:00","Estadio Ciudad de México","RPC","MEX"]]},
  {id:"B",teams:["CAN","QAT","SUI","BOS"],m:[
    ["B1","Vie 12 Jun · 16:00","Estadio Toronto","CAN","BOS"],
    ["B2","Sáb 13 Jun · 16:00","Estadio Bahía de S. F.","QAT","SUI"],
    ["B3","Jue 18 Jun · 16:00","Estadio Los Ángeles","SUI","BOS"],
    ["B4","Jue 18 Jun · 19:00","Estadio Vancouver","CAN","QAT"],
    ["B5","Mié 24 Jun · 16:00","Estadio Seattle","BOS","QAT"],
    ["B6","Mié 24 Jun · 16:00","Estadio Vancouver","SUI","CAN"]]},
  {id:"C",teams:["BRA","MAR","ESC","HAI"],m:[
    ["C1","Sáb 13 Jun · 19:00","Estadio Nueva York / NJ","BRA","MAR"],
    ["C2","Sáb 13 Jun · 22:00","Estadio Gillette","HAI","ESC"],
    ["C3","Vie 19 Jun · 16:00","Estadio Gillette","ESC","MAR"],
    ["C4","Sáb 20 Jun · 22:00","Estadio Filadelfia","BRA","HAI"],
    ["C5","Mié 24 Jun · 19:00","Estadio Miami","ESC","BRA"],
    ["C6","Mié 24 Jun · 19:00","Estadio Atlanta","MAR","HAI"]]},
  {id:"D",teams:["USA","PAR","AUS","TUR"],m:[
    ["D1","Vie 12 Jun · 22:00","Estadio Los Ángeles","USA","PAR"],
    ["D2","Dom 14 Jun · 01:00","Estadio Vancouver","AUS","TUR"],
    ["D3","Vie 19 Jun · 16:00","Estadio Seattle","USA","AUS"],
    ["D4","Sáb 20 Jun · 00:00","Estadio Bahía de S. F.","TUR","PAR"],
    ["D5","Jue 25 Jun · 23:00","Estadio Bahía de S. F.","PAR","AUS"],
    ["D6","Jue 25 Jun · 23:00","Estadio Los Ángeles","TUR","USA"]]},
  {id:"E",teams:["ALE","ECU","CDM","CUR"],m:[
    ["E1","Dom 14 Jun · 14:00","Estadio Houston","ALE","CUR"],
    ["E2","Dom 14 Jun · 20:00","Estadio Filadelfia","CDM","ECU"],
    ["E3","Sáb 20 Jun · 14:00","Estadio Toronto","ALE","CDM"],
    ["E4","Sáb 20 Jun · 21:00","Estadio Kansas City","ECU","CUR"],
    ["E5","Jue 25 Jun · 17:00","Estadio Filadelfia","CUR","CDM"],
    ["E6","Jue 25 Jun · 17:00","Estadio Nueva York / NJ","ECU","ALE"]]},
  {id:"F",teams:["PBA","JAP","TUN","SUE"],m:[
    ["F1","Dom 14 Jun · 17:00","Estadio Dallas","PBA","JAP"],
    ["F2","Dom 14 Jun · 23:00","Estadio Monterrey","SUE","TUN"],
    ["F3","Sáb 20 Jun · 20:00","Estadio Houston","PBA","SUE"],
    ["F4","Dom 21 Jun · 01:00","Estadio Monterrey","TUN","JAP"],
    ["F5","Jue 25 Jun · 20:00","Estadio Dallas","JAP","SUE"],
    ["F6","Jue 25 Jun · 20:00","Estadio Kansas City","TUN","PBA"]]},
  {id:"G",teams:["BEL","IRA","EGI","NZL"],m:[
    ["G1","Lun 15 Jun · 16:00","Estadio Seattle","BEL","EGI"],
    ["G2","Lun 15 Jun · 22:00","Estadio Los Ángeles","IRA","NZL"],
    ["G3","Dom 21 Jun · 16:00","Estadio Los Ángeles","BEL","IRA"],
    ["G4","Dom 21 Jun · 19:00","Estadio Vancouver","NZL","EGI"],
    ["G5","Sáb 27 Jun · 00:00","Estadio Vancouver","EGI","IRA"],
    ["G6","Sáb 27 Jun · 00:00","Estadio Seattle","NZL","BEL"]]},
  {id:"H",teams:["ESP","URU","ARA","CAB"],m:[
    ["H1","Lun 15 Jun · 13:00","Estadio Atlanta","ESP","CAB"],
    ["H2","Lun 15 Jun · 19:00","Estadio Miami","ARA","URU"],
    ["H3","Dom 21 Jun · 13:00","Estadio Atlanta","ESP","ARA"],
    ["H4","Dom 21 Jun · 19:00","Estadio Houston","URU","CAB"],
    ["H5","Vie 26 Jun · 21:00","Estadio Houston","CAB","ARA"],
    ["H6","Vie 26 Jun · 21:00","Estadio Guadalajara","URU","ESP"]]},
  {id:"I",teams:["FRA","SEN","NOR","IRK"],m:[
    ["I1","Mar 16 Jun · 16:00","Estadio Nueva York / NJ","FRA","SEN"],
    ["I2","Mar 16 Jun · 19:00","Estadio Boston","IRK","NOR"],
    ["I3","Lun 22 Jun · 18:00","Estadio Filadelfia","FRA","IRK"],
    ["I4","Lun 22 Jun · 21:00","Estadio Nueva York / NJ","SEN","NOR"],
    ["I5","Vie 26 Jun · 16:00","Estadio Toronto","SEN","IRK"],
    ["I6","Vie 26 Jun · 16:00","Estadio Boston","NOR","FRA"]]},
  {id:"J",teams:["ARG","ALG","AUT","JOR"],m:[
    ["J1","Mar 16 Jun · 22:00","Estadio Kansas City","ARG","ALG"],
    ["J2","Mié 17 Jun · 01:00","Estadio San Francisco","AUT","JOR"],
    ["J3","Mié 17 Jun · 14:00","Estadio Dallas","ARG","AUT"],
    ["J4","Mar 23 Jun · 00:00","Estadio Bahía de S. F.","JOR","ALG"],
    ["J5","Mar 23 Jun · 23:00","Estadio Kansas City","ALG","AUT"],
    ["J6","Sáb 27 Jun · 23:00","Estadio Dallas","JOR","ARG"]]},
  {id:"K",teams:["POR","COL","UZB","RDC"],m:[
    ["K1","Mié 17 Jun · 14:00","Estadio Houston","POR","RDC"],
    ["K2","Mié 17 Jun · 23:00","Estadio Ciudad de México","UZB","COL"],
    ["K3","Mar 23 Jun · 14:00","Estadio Houston","POR","UZB"],
    ["K4","Mar 23 Jun · 17:00","Estadio Guadalajara","COL","RDC"],
    ["K5","Sáb 27 Jun · 20:30","Estadio Atlanta","RDC","UZB"],
    ["K6","Sáb 27 Jun · 20:30","Estadio Miami","COL","POR"]]},
  {id:"L",teams:["ING","CRO","GHA","PAN"],m:[
    ["L1","Mié 17 Jun · 17:00","Estadio Dallas","ING","CRO"],
    ["L2","Mié 17 Jun · 20:00","Estadio Toronto","GHA","PAN"],
    ["L3","Mar 23 Jun · 17:00","Estadio Boston","ING","GHA"],
    ["L4","Mar 23 Jun · 20:00","Estadio Filadelfia","PAN","CRO"],
    ["L5","Sáb 27 Jun · 18:00","Estadio Filadelfia","CRO","GHA"],
    ["L6","Sáb 27 Jun · 18:00","Estadio Nueva York / NJ","PAN","ING"]]}
];
