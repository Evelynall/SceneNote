import { deleteProject, getAllProjects, getProjectById, saveProject, deleteTag, getAllTags, getTagById, saveTag } from '../database/indexedDB'
import type { Project, Tag } from '../types'

export interface ProjectStorage {
  getProject(projectId: string): Promise<Project | null>
  getProjects(): Promise<Project[]>
  saveProject(project: Project): Promise<void>
  deleteProject(projectId: string): Promise<void>
}

export interface TagStorage {
  getTag(tagId: string): Promise<Tag | null>
  getTags(): Promise<Tag[]>
  saveTag(tag: Tag): Promise<void>
  deleteTag(tagId: string): Promise<void>
}

export const projectStorage: ProjectStorage = {
  getProject: getProjectById,
  getProjects: getAllProjects,
  saveProject,
  deleteProject,
}

export const tagStorage: TagStorage = {
  getTag: getTagById,
  getTags: getAllTags,
  saveTag,
  deleteTag,
}