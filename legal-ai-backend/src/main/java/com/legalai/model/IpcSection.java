package com.legalai.model;

import java.util.List;

public class IpcSection {
    private String section;
    private String title;
    private List<String> keywords;
    private String description;
    private String punishment;
    private String act;

    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public List<String> getKeywords() { return keywords; }
    public void setKeywords(List<String> keywords) { this.keywords = keywords; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getPunishment() { return punishment; }
    public void setPunishment(String punishment) { this.punishment = punishment; }
    public String getAct() { return act; }
    public void setAct(String act) { this.act = act; }
}
